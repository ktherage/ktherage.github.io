<?php

declare(strict_types=1);

namespace Cecil\Generator;

use Cecil\Generator\Oss\GitHubContributions;
use Symfony\Component\Yaml\Yaml;

/*
 * Injects merged external pull requests ("contributions") into the
 * open-source pages (EN + FR) during the build ("Generating pages" step).
 *
 * The result is cached in data/oss-contributions.yaml (single file) and
 * refreshed when the cache is older than TTL, missing, or OSS_REFRESH=1.
 *
 * Never fails the build: on any error the pages fall back to the stale
 * cache, site.data, or an empty state rendered by the layout.
 */
class OssContributions extends AbstractGenerator implements GeneratorInterface
{
    private const USERNAME = 'ktherage';

    private const TTL = 604_800; // 7 days, in seconds

    private const PER_PAGE = 100;

    private const MAX_PAGES = 3;

    public function generate(): void
    {
        if (!$this->vendorAvailable()) {
            return;
        }
        $this->inject($this->resolve());
    }

    private function resolve(): array
    {
        $file = $this->cacheFile();
        if ($this->isFresh($file)) {
            return $this->parse($file);
        }
        $items = GitHubContributions::fromEnvironment(self::USERNAME)->fetchMerged(
            self::PER_PAGE,
            self::MAX_PAGES,
        ) ?? $this->parse($file);
        $this->write($file, $items);

        return $items;
    }

    private function cacheFile(): string
    {
        return $this->config->getSourceDir() . '/data/oss-contributions.yaml';
    }

    private function isFresh(string $file): bool
    {
        return is_file($file) && '1' !== getenv('OSS_REFRESH') && (time() - (int) filemtime($file)) <= self::TTL;
    }

    private function parse(string $file): array
    {
        try {
            $data = Yaml::parseFile($file);
        } catch (\Throwable) {
            return [];
        }

        return \is_array($data) ? $data : [];
    }

    private function write(string $file, array $items): void
    {
        $yaml = "# Generated during build by Cecil\\Generator\\OssContributions — do not edit by hand.\n";
        $yaml .= Yaml::dump($items, 2, 2);
        file_put_contents(filename: $file, data: $yaml);
    }

    private function inject(array $items): void
    {
        foreach ($this->builder->getPages() ?? [] as $page) {
            if ('open-source' !== $page->getId() && !str_ends_with((string) $page->getPath(), 'open-source')) {
                continue;
            }
            $page->setVariable('contributions', $items);
            $this->generatedPages->add($page);
        }
    }

    private function vendorAvailable(): bool
    {
        $autoload = \dirname(path: __DIR__, levels: 3) . '/vendor/autoload.php';
        if (!is_file($autoload)) {
            return false;
        }
        require_once $autoload;

        return true;
    }
}
