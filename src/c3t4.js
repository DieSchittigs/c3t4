#!/usr/bin/env node

const inquirer = require('inquirer')
const Promise = require('bluebird')
const chalk = require('chalk')
const { exec } = require('child_process')
const { resolve, basename } = require('path')
const Replacer = require('./Replacer')

const fs = Promise.promisifyAll(require('fs'))
const glob = Promise.promisify(require('glob'))

console.reset = function () {
  return process.stdout.write('\033c') // eslint-disable-line no-octal
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
      message: 'If you want to set a global composer namespace, specify it now, otherwise leave it empty.',
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
      default: (namespace ? namespace : 'namespace') + '/' + name
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

async function copyFixtures (fixturePath, targetPath, replacer) {
    const fixtures = await glob(fixturePath + '/**/*')
    
    fs.mkdir(targetPath, (err) => {
      if (err && err.code !== 'EEXIST') throw err
    })

    Promise.reduce(fixtures, async (irrelevant, fixture) => {
        const path = resolve(targetPath, fixture.replace(fixturePath, '').replace(/^\//, ''))

        const stats = await fs.lstatAsync(fixture)
        if (stats.isDirectory()) {
          try {
            await fs.mkdirAsync(path)
          } catch (err) {
            if (err.code !== 'EEXIST') throw err
          }

          return true
        }

        const fixtureContent = await fs.readFileAsync(fixture, 'utf8')
        await fs.writeFileAsync(replacer.replace(path), replacer.replace(fixtureContent))
        
        return true
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

  await Promise.reduce(modules, async (irrelevant, {name, path}) => {
    console.reset()
    const replacer = new Replacer()

    replacer.set('AuthorName', author.name)
    replacer.set('AuthorName', author.email)

    console.log(chalk.green(`\nPlease answer a couple of questions about your module ${chalk.inverse(name)}.\n`))
    const options = await getModuleOptions(name, basicOptions.composerNamespace)
    
    replacer.set('BundleComposerName', options.composerName)
    replacer.set('BundleNamespace', options.namespace)
    replacer.set('BundleName', options.bundleName)

    const fixturePath = resolve(__dirname, '../fixtures')
    await copyFixtures(fixturePath, resolve(basicOptions.newBundlePath, options.targetDir), replacer)
    
    // await copyModule()
    // await adjustModule()

    return true
  })
}())
