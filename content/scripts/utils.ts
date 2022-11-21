import FastGlob from 'fast-glob'
import { readFile, writeFile } from 'fs/promises'
import { resolve } from 'path'
import slugify from 'slugify'

import { DEFAULT_LANGUAGE_TAG } from '$shared/constants'
import type { Story, Tag } from '$shared/types'
import { SelectedCollections, SINGLETONS } from './build-content'

export const slugifyName = (string: string, language = DEFAULT_LANGUAGE_TAG) =>
    slugify(string, {
        replacement: '-', // replace spaces with replacement character, defaults to `-`
        remove: undefined, // remove characters that match regex, defaults to `undefined`
        lower: true, // convert to lower case, defaults to `false`
        strict: true, // strip special characters except replacement, defaults to `false`
        locale: language, // language code of the locale to use
        trim: true, // trim leading and trailing replacement chars, defaults to `true`
    })

/**
 * Create a slugified, backwards compatible link.
 *
 * @param name Name of the object to link to. Can be updated easily while keeping links backwards compatible.
 * @param uniqueSlug cuid.slug() that should remain the same for an object as long as it exists in the database.
 * @returns Slugified link
 */
export const createBackwardsCompatibleLink = (
    name: string,
    uniqueSlug: string,
    language = DEFAULT_LANGUAGE_TAG,
) => `${slugifyName(name, language)}-${uniqueSlug}`

export const readJSON = (path: string) => readFile(path, { encoding: 'utf-8' }).then(JSON.parse)

export const writeJSON = (path: string, data: any, indentation: number = 0) =>
    writeFile(path, JSON.stringify(data, null, indentation), {
        encoding: 'utf-8',
    })

const getPaths = (...paths: string[]) => FastGlob(resolve(...paths))

export const getContentPaths = async (selected: SelectedCollections, baseDir: string) => {
    const collections = selected.collections.length
        ? await Promise.all(
              selected.collections.flatMap((collection) =>
                  getPaths(baseDir, `${collection}/*.json`),
              ),
          )
        : []

    const singletons = selected.singletons.length
        ? (
              await Promise.all(
                  selected.singletons.flatMap((singleton) =>
                      getPaths(baseDir, `${SINGLETONS[singleton]}.json`),
                  ),
              )
          ).flat()
        : []

    return { collections, singletons }
}

/**
 * Ensures the url works in the live app or website by removing the full prefix added by the CMS.
 */
export const getConsistentAssetURL = (url: string, unwantedPrefix: string) =>
    url.replace(unwantedPrefix, '')

export const sortNamesAlphabetically = (a: Tag, b: Tag) => a.name.localeCompare(b.name)

export const sortByPublishingDate = (a: Story, b: Story) =>
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
