import {schema} from '../../server/utils/db'

type Schema = typeof schema

export type TableNames = keyof Schema
