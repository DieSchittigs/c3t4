<?php

namespace {BundleNamespace}\ContaoManager;

use {BundleNamespace}\{BundleName}{BundleAlias};
use Contao\ManagerPlugin\Bundle\Config\BundleConfig;
use Contao\ManagerPlugin\Bundle\BundlePluginInterface;
use Contao\ManagerPlugin\Bundle\Parser\ParserInterface;
use Contao\CoreBundle\ContaoCoreBundle;

class Plugin extends BundlePluginInterface
{
    public function getBundles(ParserInterface $parser)
    {
        return [
            BundleConfig::create({BundleNameOrAlias}::class)
                ->setLoadAfter([ContaoCoreBundle::class])
        ];
    }
}
