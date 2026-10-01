<?php

declare(strict_types=1);

namespace Cecil\Generator\Oss;

use Symfony\Component\HttpClient\HttpClient;
use Symfony\Component\HttpClient\ScopingHttpClient;
use Symfony\Contracts\HttpClient\HttpClientInterface;

/*
 * Enriches a search-result PR with its full merged_at timestamp via one extra
 * API call. Instantiated only when a token is available; silent no-op (PR
 * unchanged) on any error so callers keep the date-only fallback.
 */
class GitHubPullRequestEnricher
{
    private readonly HttpClientInterface $client;

    public function __construct(
        #[\SensitiveParameter]
        private readonly string $token,
    ) {
        $this->client = ScopingHttpClient::forBaseUri(HttpClient::create(), 'https://api.github.com', [
            'headers' => [
                'Accept: application/vnd.github+json',
                'User-Agent: ktherage.github.io-oss-fetch',
                'Authorization: Bearer ' . $this->token,
            ],
            'timeout' => 20,
        ]);
    }

    public function enrich(array $pr): array
    {
        $path = $this->detailPath($pr);
        if (null === $path) {
            return $pr;
        }
        try {
            $detail = $this->client->request('GET', $path)->toArray();
        } catch (\Throwable) {
            return $pr;
        }
        $mergedAt = $detail['merged_at'] ?? null;
        if (!\is_string($mergedAt) || '' === $mergedAt) {
            return $pr;
        }
        $pr['pull_request']['merged_at'] = $mergedAt;

        return $pr;
    }

    /** API path like /repos/symfony/symfony/pulls/1, or null when unresolvable. */
    private function detailPath(array $pr): ?string
    {
        $parts = explode('/', (string) ($pr['repository_url'] ?? ''));
        [$owner, $repo] = array_slice($parts, -2) + [null, null];
        $number = $pr['number'] ?? null;
        if (!\is_string($owner) || '' === $owner || !\is_string($repo) || '' === $repo || !\is_int($number)) {
            return null;
        }

        return "/repos/{$owner}/{$repo}/pulls/{$number}";
    }
}
