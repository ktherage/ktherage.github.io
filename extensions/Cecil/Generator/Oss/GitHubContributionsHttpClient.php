<?php

declare(strict_types=1);

namespace Cecil\Generator\Oss;

use Symfony\Component\HttpClient\HttpClient;
use Symfony\Component\HttpClient\ScopingHttpClient;
use Symfony\Contracts\HttpClient\HttpClientInterface;

/*
 * Fetches merged pull requests authored by a user on third-party public
 * repositories, via the GitHub Search API.
 *
 * Auth: optional GITHUB_TOKEN env var (higher rate limits); works anonymously.
 * Returns null on any error so callers can fall back to cached data.
 */
class GitHubContributionsHttpClient
{
    public function __construct(
        private readonly string $username,
        #[\SensitiveParameter]
        private readonly ?string $token = null,
    ) {}

    public static function fromEnvironment(string $username): self
    {
        $token = getenv('GITHUB_TOKEN');

        return new self($username, \is_string($token) ? $token : null);
    }

    /** @return list<array{title:string,url:string,repo:string,repo_url:string,avatar:string,merged_at:string}>|null */
    public function fetchMerged(int $perPage, int $maxPages): ?array
    {
        $items = [];
        for ($page = 1; $page <= $maxPages; ++$page) {
            $batch = $this->fetchPage($this->client(), $page, $perPage);
            if (null === $batch) {
                return null;
            }
            array_push($items, ...array_map($this->toItem(...), array_filter($batch, $this->isContribution(...))));
            if (\count($batch) < $perPage) {
                break;
            }
        }

        return $items;
    }

    /** @return list<array>|null */
    private function fetchPage(HttpClientInterface $client, int $page, int $perPage): ?array
    {
        try {
            $data = $client->request('GET', '/search/issues', [
                'query' => [
                    'q' => 'author:' . $this->username . ' type:pr is:merged',
                    'sort' => 'updated',
                    'order' => 'desc',
                    'per_page' => $perPage,
                    'page' => $page,
                ],
            ])->toArray();
        } catch (\Throwable) {
            return null;
        }
        $items = $data['items'] ?? null;

        return \is_array($items) ? $items : null;
    }

    /** A PR is a contribution when it targets someone else's repo and is merged. */
    private function isContribution(array $pr): bool
    {
        $parts = explode('/', (string) ($pr['repository_url'] ?? ''));
        [$owner] = array_slice($parts, -2) + [null];
        $mergedAt = (string) ($pr['pull_request']['merged_at'] ?? '');

        return \is_string($owner) && '' !== $mergedAt && 0 !== strcasecmp($owner, $this->username);
    }

    /** @return array{title:string,url:string,repo:string,repo_url:string,avatar:string,merged_at:string} */
    private function toItem(array $pr): array
    {
        $parts = explode('/', (string) $pr['repository_url']);
        $owner = $parts[\count($parts) - 2];
        $repo = $parts[\count($parts) - 1];

        return [
            'title' => (string) $pr['title'],
            'url' => (string) $pr['html_url'],
            'repo' => $owner . '/' . $repo,
            'repo_url' => 'https://github.com/' . $owner . '/' . $repo,
            'avatar' => 'https://github.com/' . $owner . '.png',
            'merged_at' => substr(string: (string) $pr['pull_request']['merged_at'], offset: 0, length: 10),
        ];
    }

    private function client(): HttpClientInterface
    {
        $headers = ['Accept: application/vnd.github+json', 'User-Agent: ktherage.github.io-oss-fetch'];
        if (null !== $this->token) {
            $headers[] = 'Authorization: Bearer ' . $this->token;
        }

        return ScopingHttpClient::forBaseUri(HttpClient::create(), 'https://api.github.com', [
            'headers' => $headers,
            'timeout' => 20,
        ]);
    }
}
