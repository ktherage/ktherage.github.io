<?php

namespace Cecil\Renderer\PostProcessor;

use Cecil\Collection\Page\Page;

class BootstrapAlerts extends AbstractPostProcessor
{
    private array $map = [
        'tip' => 'success',
        'warning' => 'warning',
        'caution' => 'danger',
        'info' => 'info',
        'important' => 'primary',
    ];

    public function process(Page $page, string $output, string $format): string
    {
        if ('html' !== $format) {
            return $output;
        }

        return preg_replace_callback(
            '/<aside class="note(?: note-(\w+))?">(.*?)<\/aside>/s',
            fn ($m) => sprintf(
                '<div class="alert alert-%s" role="note">%s</div>',
                $this->map[$m[1] ?? ''] ?? 'secondary',
                $m[2]
            ),
            $output
        );
    }
}
