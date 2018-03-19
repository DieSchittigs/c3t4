<?php

namespace DieSchittigs\C3t4\Commands;

use LaravelZero\Framework\Commands\Command;
use Padarom\LaravelZero\SupportsInteractiveMode;
use DieSchittigs\C3t4\Replacements;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;

class ConvertCommand extends Command
{
    use SupportsInteractiveMode;

    /**
     * The signature of the command.
     *
     * @var string
     */
    protected $signature = 'convert';

    /**
     * The description of the command.
     *
     * @var string
     */
    protected $description = 'Converts a Contao 3.5 module to a Symfony-based Contao 4.4 bundle';

    public function __construct()
    {
        parent::__construct();

        $this->replacements = new Replacements;
    }

    /**
     * Execute the console command.
     *
     * @return void
     */
    public function handle(): void
    {
        $this->replacements->BundleComposerName = 'dieschittigs/contao-bundle';
        $this->replacements->BundleNamespace = 'DieSchittigs\\ContaoBundle';
        $this->replacements->BundleName = 'BundlePluginInterface';
        $this->replacements->BundleAlias = 'MyBundle';

        $gitAuthor = $this->getGitAuthor();

        $this->replacements->AuthorName  = $this->prompt('Author Name', $gitAuthor['name']);
        $this->replacements->AuthorEmail = $this->prompt('Author Email', $gitAuthor['email']);
        
        $this->copyFixtures();
    }

    protected function getGitAuthor()
    {
        $name = $email = null;
        exec('git config --global user.name', $name);
        exec('git config --global user.email', $email);

        $name  = count($name)  ? $name[0]  : null;
        $email = count($email) ? $email[0] : null;

        return compact('name', 'email');
    }

    protected function copyFixtures()
    {
        $fixtures = base_path('fixtures/bundle');
        $target = base_path('bundles');

        $directoryIterator = new RecursiveDirectoryIterator($fixtures);
        $iterator = new RecursiveIteratorIterator($directoryIterator);

        foreach ($iterator as $file) {
            // We do not want to include '..' and any dotfiles (such as '.gitkeep')
            $filename = $file->getFilename();
            if ($filename == '..' || (strpos($filename, '.') === 0 && strlen($filename) > 1))
                continue;

            $sourcePath = rtrim($file->getPathname(), '.');
            $targetPath = str_replace($fixtures, $target, $sourcePath);

            if (is_dir($sourcePath) && !is_dir($targetPath)) {
                mkdir($targetPath);
            } elseif (is_file($sourcePath)) {
                $content = file_get_contents($sourcePath);
                $targetPath = $this->replacements->replace($targetPath);
                file_put_contents($targetPath, $this->replacements->replace($content));
            }
        }
    }
}
