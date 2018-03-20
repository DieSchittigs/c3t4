#!/usr/bin/env node

const inquirer = require('inquirer')
const Promise = require('bluebird')
const chalk = require('chalk')
const fs = require('fs-extra')
const klaw = require('klaw')
const through2 = require('through2')
const { exec } = require('child_process')
const { resolve, basename } = require('path')
const Replacer = require('./Replacer')

const glob = Promise.promisify(require('glob'))

console.reset = function () {
  return process.stdout.write('\x1Bc') // == \033c
}

function git (option) {
  return new Promise((resolve, reject) => {
    exec(`git config --global ${option}`, (err, out) => {
      resolve(err ? null : out.trim())
    })
  })
}

function getBasicOptions () {
  return inquirer.prompt([
    {
      name: 'oldModulesPath',
      default: 'system/modules',
      message: 'Relative path to your Contao 3 modules',
      validate: path => fs.existsSync(path) ? true : 'Not a valid path.'
    },
    {
      name: 'newBundlePath',
      default: 'bundles',
      message: 'Relative path to where your Contao 4 bundles should be stored',
      validate: path => fs.existsSync(path) ? true : 'Please make sure this directory exists.'
    },
    {
      name: 'composerNamespace',
      message: 'If you want to set a global composer namespace, specify it now, otherwise leave it empty.'
    }
  ])
}

async function findConvertibleModules (path) {
  const scannedModules = await glob(resolve(path) + '/*/')
  const response = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'modules',
      message: 'Which modules do you want to convert to bundles?',
      choices: scannedModules.map((m) => {
        return {
          name: basename(m),
          value: { name: basename(m), path: m },
          checked: true
        }
      })
    }
  ])

  return response.modules
}

async function getModuleOptions (name, namespace) {
  return inquirer.prompt([
    {
      name: 'targetDir',
      message: 'What should the bundle directory be named?',
      default: name
    },
    {
      name: 'composerName',
      message: 'What should your composer name be set to?',
      default: (namespace || 'namespace') + '/' + name
    },
    {
      name: 'namespace',
      message: 'What is your PSR-4 namespace?',
      default: 'YourNamespace\\BundleName'
    },
    {
      name: 'bundleName',
      message: 'What should your bundle be called?',
      default: 'BundleName'
    }
  ])
}

function copyFixtures (fixturePath, targetPath, replacer) {
  return new Promise(async (resolve, reject) => {
    await fs.copy(fixturePath, targetPath, {
      filter: item => basename(item)[0] !== '.'
    })

    klaw(targetPath)
      .pipe(through2.obj(async (item, enc, next) => {
        if (!item.stats.isFile()) return next()

        // Replace content
        const content = await fs.readFile(item.path, 'utf8')
        const replaced = replacer.replace(content)

        // Rename if necessary
        const renamed = replacer.replace(item.path)
        if (renamed !== item.path) {
          await fs.rename(item.path, renamed)
          item.path = renamed
        }

        // Write replaced content
        await fs.writeFile(item.path, replaced)
        next()
      }))
      .on('data', () => {}) // noop is necessary
      .on('end', resolve)
  })
}

async function copyModule (sourcePath, destinationPath) {
  return fs.copy(sourcePath, destinationPath, {
    filter: item => (basename(item) !== 'autoload.ini' && basename(item) !== 'autoload.php')
  })
}

async function adjustModule (modulePath) {
  const pResolve = resolve

  return new Promise(async (resolve, reject) => {
    klaw(modulePath, { filter: item => !(item.replace(modulePath, '').startsWith('/assets') && !item.endsWith('assets')) })
      .pipe(through2.obj(async (item, enc, next) => {
        if (!item.stats.isDirectory() || basename(item.path) !== 'assets') return next()
        const newPath = pResolve(item.path.replace(new RegExp('assets$'), '../public'))

        await fs.rename(item.path, newPath)
        resolve() // There is only one "assets" directory, so we don't have to wait any longer.
      }))
      .on('data', () => {})
      .on('end', resolve)
  })
}

(async function () {
  console.reset()

  const basicOptions = await getBasicOptions()
  const modules = await findConvertibleModules(basicOptions.oldModulesPath)

  const author = await inquirer.prompt([
    {
      name: 'name',
      default: await git('user.name'),
      message: 'Author Name'
    },
    {
      name: 'email',
      default: await git('user.email'),
      message: 'Author Email'
    }
  ])

  const failed = []
  let queued = []

  await Promise.reduce(modules, async (irrelevant, {name, path}) => {
    console.reset()
    queued.forEach(q => console.log(q))
    queued = []

    const replacer = new Replacer()
    replacer.set('AuthorName', author.name)
    replacer.set('AuthorEmail', author.email)

    console.log(chalk.green(`\nPlease answer a couple of questions about your module ${chalk.inverse(name)}.\n`))
    const options = await getModuleOptions(name, basicOptions.composerNamespace)

    replacer.set('BundleComposerName', options.composerName)
    replacer.set('BundleNamespace', options.namespace)
    replacer.set('BundleName', options.bundleName)

    const fixturePath = resolve(__dirname, '../fixtures')
    const resolvedBundlePath = resolve(basicOptions.newBundlePath, options.targetDir)

    try {
      await copyFixtures(fixturePath, resolvedBundlePath, replacer)
      await copyModule(path, resolve(resolvedBundlePath, 'src/Resources/contao'))
      await adjustModule(resolve(resolvedBundlePath, 'src/Resources/contao'))
    } catch (err) {
      queued.push(chalk.red(`\nAn unknown exception occured: ${chalk.inverse(err.code)}`))
      queued.push(chalk.red(`The bundle ${chalk.inverse(name)} wasn't created.`))
      failed.push(name)
    }

    return true
  }, [])

  console.reset()

  if (failed.length) {
    console.log(chalk.red('\nThe following bundles could not be created.'))
    failed.forEach(f => console.log(` - ${f}`))
  } else {
    console.log(chalk.green('All bundles successfully created.'))
  }
}())
