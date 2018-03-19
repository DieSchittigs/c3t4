<?php

namespace {BundleNamespace}\ContaoManager;

use Contao\ManagerPlugin\Bundle\Config\BundleConfig;
use Contao\ManagerPlugin\Bundle\BundlePluginInterface;
use Contao\ManagerPlugin\Bundle\Parser\ParserInterface;
use Contao\CoreBundle\ContaoCoreBundle;
use {BundleNamespace}\{BundleName};

class Plugin extends BundlePluginInterface
{
    public function getBundles(ParserInterface $parser)
    {
        return [
            BundleConfig::create({BundleName}::class)
                ->setLoadAfter([ContaoCoreBundle::class]);
        ];
    }
}
