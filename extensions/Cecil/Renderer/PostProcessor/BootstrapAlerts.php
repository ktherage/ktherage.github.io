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

        $output = str_replace('</aside>', '</div>', $output);

        return preg_replace_callback(
            '/<aside class="note(?: note-(\w+))?">/',
            fn ($m) => sprintf(
                '<div class="alert alert-%s" role="alert">',
                $this->map[$m[1] ?? ''] ?? 'secondary'
            ),
            $output
        );
    }
}
