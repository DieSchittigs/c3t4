<?php

namespace DieSchittigs\C3t4\Commands;

use Illuminate\Console\Scheduling\Schedule;
use LaravelZero\Framework\Commands\Command;

class ConvertCommand extends Command
{
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

    /**
     * Execute the console command.
     *
     * @return void
     */
    public function handle(): void
    {
        //
    }
}
