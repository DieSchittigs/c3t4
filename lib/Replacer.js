const { reduce, zipObject } = require('lodash')

const ReplacementOptions = [
  'BundleComposerName',
  'BundleNamespace',
  'BundleName',
  'AuthorName',
  'AuthorEmail'
]

module.exports = class Replacer {
  constructor () {
    this.optionValues = zipObject(ReplacementOptions, Array(ReplacementOptions.length).fill(''))
  }

  set (option, value) {
    this.optionValues[option] = value

    return this
  }

  listReducer (list, name) {
    list[name] = this.optionValues[name]

    switch (name) {
      case 'BundleNamespace':
        list.BundleNamespaceWithTwoSlashes = list[name].replace(/\\/, '\\\\')
        break

      case 'BundleName':
        let needsReplacement = list[name] === 'Bundle'
        list.SymfonyBundleName = needsReplacement ? 'SymfonyBundle' : 'Bundle'
        list.SymfonyBundleAlias = needsReplacement ? ' as SymfonyBundle' : ''

        const otherUses = ['BundleConfig', 'BundlePluginInterface', 'ParserInterface', 'ContaoCoreBundle']
        needsReplacement = otherUses.includes(list[name])
        list.BundleAlias = needsReplacement ? ' as CustomBundle' : ''
        list.BundleNameOrAlias = needsReplacement ? 'CustomBundle' : list[name]
        break
    }

    return list
  }

  parse () {
    this.parsedReplacements = reduce(ReplacementOptions, this.listReducer.bind(this), {})
  }

  replace (subject) {
    if (!this.parsedReplacements) this.parse()

    return reduce(this.parsedReplacements, (string, value, search) => {
      return string.replace(new RegExp(`\\{${search}\\}`, 'g'), value)
    }, subject)
  }
}
