import { describe, expect, it } from 'vitest'
import { findDuplicateIds } from './validate-problems'
import {
  makeValidManifest,
  makeValidPackFile,
} from '../src/test/fixtures'
import { manifestSchema, problemPackFileSchema } from '../src/types/problem'

describe('findDuplicateIds', () => {
  it('returns empty when all ids are unique', () => {
    expect(findDuplicateIds(['a', 'b', 'c'])).toEqual([])
    expect(findDuplicateIds([])).toEqual([])
  })

  it('detects duplicate pack ids in a manifest', () => {
    const manifest = makeValidManifest(2)
    manifest.packs[1].id = manifest.packs[0].id
    const parsed = manifestSchema.parse(manifest)
    const duplicates = findDuplicateIds(parsed.packs.map((p) => p.id))
    expect(duplicates).toHaveLength(1)
    expect(duplicates[0]).toBe('vault-00-calibration')
  })

  it('detects duplicate problem refs inside a pack file', () => {
    const packFile = makeValidPackFile()
    const ref = packFile.problems[0]
    packFile.problems = [ref, ...packFile.problems]
    const parsed = problemPackFileSchema.parse(packFile)
    const duplicates = findDuplicateIds(parsed.problems)
    expect(duplicates).toEqual([ref])
  })
})
