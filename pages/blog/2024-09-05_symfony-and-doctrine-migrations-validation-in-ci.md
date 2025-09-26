---
title: "Symfony & Doctrine Migrations: Validation in CI"
description: "API Platform con 2025 - DAY 2 - an overview of the talks I attended at the API Platform Conference in 2025."
image: ~
published: true
tags: [Symfony, Doctrine, Migrations, CI, Database, PHP, Bash, Devops, Automation, Testing]
excerpt: >-
  I had the opportunity to work on a project with a team that was relatively new to Doctrine migrations. To help them get used to it, and to discard the possibility of having pull (or merge) requests with changes to doctrine entities without generating a migration.

  Here is how I did it. I hope you'll enjoy it!
---
I had the opportunity to work on a project with a team that was relatively new to Doctrine migrations. To help them get used to it, and to discard the possibility of having pull (or merge) requests with changes to doctrine entities without generating a migration.

Here is how I did it. I hope you'll enjoy it!

## Disclaimer

We are the 10th of July 2025 now and this article is outdated due to the merge of the Pull Request https://github.com/doctrine/migrations/issues/1406 and so running `bin/console doctrine:migrations:up-to-date` shall now take care of `schema_filter` configuration.


## How Doctrine Migrations works

When generating the migration, Doctrine will make a delta between its mapping and the current schema of the database. With this delta in "mind" (dare I say :wink:) it will generate a **migration file** with two main methods :
* `up` applies the SQL commands to fill the gap between the current database schema and its mapping. Used to deploy changes in the schema of your database.
* `down` allows to revert the migration with the SQL commands needed to "negate" the changes made in the up method. Used to roll back changes in the schema of your database.

## The magic trick

There is currently no way to easily check if a migration has not been generated. Having this code merged could lead to a database schema being out of sync with your entity mapping and so resulting in a server error.

The keywords in the above description are **migration files**. I'll use the fact that, running the command bin/console doctrine:migration:diff will result in a newly generated file and will fail if there are no changes to apply.

Knowing the list of existing files before the execution of that command, and then running it, can let me know that there are changes that were not committed to a **migration file** in this pull (or merge) request.

## Steps to do

1. Create your database
2. Run your existing migrations
3. Then run the step to check for missing changes (see below)

## Advantages

1. Testing that your migrations does not fail
2. Ensure database schema consistency with Doctrine's mapping


## You want the code snippet right!?

Here is the bash code :

```bash
#!/bin/bash

set -e
set -o pipefail

# run doctrine migration diff to check if there is a new migration file generated and check last exit code
if [[ -z $(bin/console doctrine:migrations:diff -n --quiet) ]]; then
    echo "Error ! bin/console doctrine:migration:diff found a new migration which must not be the case.";
    # cat last file (should be the newly generated one)
    cat $(ls -Art migrations/*.php | tail -n 1);
    # remove that file (just in case to comply with my paranoïac side)
    rm -f $(ls -Art migrations/*.php | tail -n 1);
    exit 1;
else
    exit 0;
fi

```

And that's it! You can now ensure that each pull (or merge) request has working migrations, with no pending changes left out of the migrations!

## Ok but why not use `bin/console doctrine:schema:validate`?

The reason was that the project we were working on was using doctrine's schema_filter configuration to filter out some tables we did not want to deal with (project-related inconvenience).

The problem with bin/console doctrine:schema:validate was that it did not take care of the configuration, and so was dumping changes (trying to delete all the "normally" filtered out tables) not related to what we wanted.

A colleague told me that this is a known issue that might be fixed soon (https://github.com/doctrine/migrations/issues/1406).


Thank you for reading this article and please leave your comments if you have any questions!
