# C3t4&ensp;&ndash;&ensp;Contao 3 to 4

This is a command line application that helps you automatically convert your Contao 3-compatible modules to Symfony-based Contao 4 bundles.

### Installation and Usage
The recommended way of installing this application is via Yarn or npm.
```sh
$ yarn global add @dieschittigs/c3t4
$ npm install --global @dieschittigs/c3t4
```

Then, simply run `c3t4` in your Contao 3 instance and follow the on-screen instructions.

### Other steps for migrating from Contao 3 to 4
In our experience, the following steps are sufficient to migrate an application from Contao 3 to 4:
1. Export your Contao 3 database
2. Import the database into your new Contao 4 database
3. Install Contao 4 on your target system using the Contao Manager
4. Run the install tool and update the database to Contao 4  
  _(make sure none of the `DROP COLUMN` or `DROP TABLE` fields are selected)_
5. Copy the content of your `templates` directory from Contao 3 to Contao 4
6. Copy the content of your `files` directory from Contao 3 to Contao 4
7. Upload your converted Contao 4 bundles
8. Add your local Contao 4 bundles to your `composer.json` (in the `repositories` and `require` fields)
9. Run `composer update`, or update your dependencies from the Contao Manager

Expectedly, Contao 4 is not fully backwards-compatible with Contao 3. For us, this was most apparent in some template rendering changes. This tool can't fix those changes for you, so you will obviously need to make sure that everything still works in your Contao 4 installation and make some minor adjustments where needed.
