<?php

namespace DieSchittigs\C3t4;

use ReflectionClass;

class Replacements
{
    const COMPOSER_NAME = 'BundleComposerName';
    const NAMESPACE = 'BundleNamespace';
    const NAME = 'BundleName';
    const AUTHOR_NAME = 'AuthorName';
    const AUTHOR_EMAIL = 'AuthorEmail';
    const LICENSE = 'License';

    /**
     * @var \Illuminate\Support\Collection
     */
    protected $baseOptions;

    /**
     * @var \Illuminate\Support\Collection
     */
    protected $optionValues;

    public function __construct()
    {
        $constants = (new ReflectionClass(self::class))->getConstants();
        $this->baseOptions = collect($constants)->values();

        $this->optionValues = $this->baseOptions->mapWithKeys(function ($item) {
            return [$item => null];
        });
    }

    public function __get($name)
    {
        return $this->optionValues->get($name);
    }

    public function __set($name, $value)
    {
        if ($this->baseOptions->contains($name)) {
            $this->optionValues[$name] = $value;
        }
    }

    public function setReplacement($list, $name)
    {
        $list[$name] = $this->$name;

        switch ($name) {
            case self::NAMESPACE:
                $list[self::NAMESPACE . 'WithTwoSlashes'] = str_replace('\\', '\\\\', $list[$name]);
                break;

            case self::NAME:
                // Replace the Symfony Bundle with an alias, if the chosen name is the same as
                // the default symfony bundle name.
                $needsReplacement = $list[self::NAME] === 'Bundle';
                $list['SymfonyBundleName']  = $needsReplacement ? 'SymfonyBundle' : 'Bundle';
                $list['SymfonyBundleAlias'] = $needsReplacement ? ' as SymfonyBundle' : $this->SymfonyBundleAlias;

                // Replace the chosen name with an alias in case it has the same name as one of the
                // other classes used in the Plugin file.
                $otherUses = ['BundleConfig', 'BundlePluginInterface', 'ParserInterface' ,'ContaoCoreBundle'];
                $needsReplacement = in_array($list[self::NAME], $otherUses);
                $list['BundleAlias']       = $needsReplacement ? ' as CustomBundle' : '';
                $list['BundleNameOrAlias'] = $needsReplacement ? 'CustomBundle' : $list[self::NAME];

                break;
        }

        return $list;
    }

    protected function replacements()
    {
        return $this->baseOptions
            ->reduce([$this, 'setReplacement'], collect())
            ->mapWithKeys(function ($item, $key) {
                return [('{' . $key . '}') => $item];
            });
    }

    public function replace($subject)
    {
        $replacements = $this->replacements();

        $search = $replacements->keys()->toArray();
        $replace = $replacements->values()->toArray();
        
        return str_replace($search, $replace, $subject);
    }
}
