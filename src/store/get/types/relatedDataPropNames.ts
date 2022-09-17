import { DataFormat, DataFormatDeclarations } from '../../../dataFormat/types'
import { RelationDeclaration, RelationType } from '../../../relations/types'

export type OneToOneFromOneName<
  T extends DataFormatDeclarations,
  K extends RelationDeclaration<T, RelationType.ONE_TO_ONE>
> = K extends { relatedToOneRecordsName: string }
  ? K['relatedToOneRecordsName']
  : Extract<T[number], { name: K['toOneField']['formatName'] }>['name']

export type OneToOneToOneName<
  T extends DataFormatDeclarations,
  K extends RelationDeclaration<T, RelationType.ONE_TO_ONE>
> = K extends { relatedFromOneRecordsName: string }
  ? K['relatedFromOneRecordsName']
  : Extract<T[number], { name: K['fromOneField']['formatName'] }>['name']

export type OneToManyFromOneName<
  T extends DataFormatDeclarations,
  K extends RelationDeclaration<T, RelationType.ONE_TO_MANY>
> = K extends { relatedToManyRecordsName: string }
  ? K['relatedToManyRecordsName']
  : DataFormat<Extract<T[number], { name: K['toManyField']['formatName'] }>>['pluralizedName']

export type OneToManyToManyName<
  T extends DataFormatDeclarations,
  K extends RelationDeclaration<T, RelationType.ONE_TO_MANY>
> = K extends { relatedFromOneRecordsName: string }
  ? K['relatedFromOneRecordsName']
  : Extract<T[number], { name: K['fromOneField']['formatName'] }>['name']

export type ManyToManyFieldRef1Name<
  T extends DataFormatDeclarations,
  K extends RelationDeclaration<T, RelationType.MANY_TO_MANY>
> = K extends { relatedFieldRef2RecordsName: string }
  ? K['relatedFieldRef2RecordsName']
  : DataFormat<Extract<T[number], { name: K['fieldRef2']['formatName'] }>>['pluralizedName']

export type ManyToManyFieldRef2Name<
  T extends DataFormatDeclarations,
  K extends RelationDeclaration<T, RelationType.MANY_TO_MANY>
> = K extends { relatedFieldRef1RecordsName: string }
  ? K['relatedFieldRef1RecordsName']
  : DataFormat<Extract<T[number], { name: K['fieldRef1']['formatName'] }>>['pluralizedName']
