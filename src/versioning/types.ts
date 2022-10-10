export type VersionTransformOptions = {
  sql: string
}

export type VersionTransformsOptions = { [version: number]: VersionTransformOptions }

export type VersionTransform<
  TVersionTransformOptions extends VersionTransformOptions = VersionTransformOptions,
  TName extends string = string,
> = TVersionTransformOptions & { name: TName }

export type VersionTransforms<
  TVersionTransformsOptions extends VersionTransformsOptions = VersionTransformsOptions,
> = {
  [TName in keyof TVersionTransformsOptions]: TVersionTransformsOptions[TName] & { name: TName }
}
