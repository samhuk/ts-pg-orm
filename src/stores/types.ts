import { SimplePgClient } from 'simple-pg-client/dist/types'
import { DataFormats } from '../dataFormat/types'
import { Relations } from '../relations/types'
import { JoinTableStoresDict } from '../store/joinTable/types'
import { Store } from '../store/types'

export type StoresAndJoinTableStoresDict<
  TDataFormats extends DataFormats,
  TRelations extends Relations,
> = Stores<TDataFormats, TRelations> & JoinTableStoresDict<TDataFormats, TRelations>

export type Stores<
  TDataFormats extends DataFormats,
  TRelations extends Relations,
> = {
  [TName in keyof TDataFormats]: Store<TDataFormats, TRelations, TName & string>
}

export type ProvisionStoresOptions<
  TDataFormats extends DataFormats = DataFormats,
  TRelations extends Relations = Relations,
> = {
  /**
   * Optional list of stores to be provisioned. This is useful if not all stores need to
   * be provisioned.
   *
   * @default
   * undefined // All stores will be provisioned
   */
  provisionStores?: ((keyof StoresAndJoinTableStoresDict<TDataFormats, TRelations>) & string)[]
  /**
   * Optional alternative `SimplePgClient` to use, different from the one initially provided
   * to create the TsPgOrm instance.
   */
  db?: SimplePgClient,
}

export type UnprovisionStoresOptions<
  TDataFormats extends DataFormats = DataFormats,
  TRelations extends Relations = Relations,
> = {
  /**
   * Optional list of stores to be unprovisioned. This is useful if not all stores need to
   * be unprovisioned.
   *
   * @default
   * undefined // All stores will be unprovisioned
   */
  unprovisionStores?: ((keyof StoresAndJoinTableStoresDict<TDataFormats, TRelations>) & string)[]
  /**
   * Optional alternative `SimplePgClient` to use, different from the one initially provided
   * to create the TsPgOrm instance.
   */
  db?: SimplePgClient,
}
