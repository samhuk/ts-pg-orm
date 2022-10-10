import { SimplePgClient } from 'simple-pg-client/dist/types'
import { DataFormats } from '../dataFormat/types'
import { StringKeysOf } from '../helpers/types'
import { Relations } from '../relations/types'
import { JoinTableStoresDict } from '../store/joinTable/types'
import { Store } from '../store/types'
import { DataFormatsAndRelationsObj } from '../tsPgOrm/types'

export type DataFormatStores<
  TDataFormats extends DataFormats,
  TRelations extends Relations,
> = {
  [TName in StringKeysOf<TDataFormats>]: Store<TDataFormats, TRelations, TName>
}

export type Stores<
  TDataFormats extends DataFormats,
  TRelations extends Relations,
> = DataFormatStores<TDataFormats, TRelations> & JoinTableStoresDict<TDataFormats, TRelations>

export type ToStores<TTsPgOrm extends DataFormatsAndRelationsObj> = Stores<TTsPgOrm['dataFormats'], TTsPgOrm['relations']>

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
  provisionStores?: StringKeysOf<Stores<TDataFormats, TRelations>>[]
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
  unprovisionStores?: StringKeysOf<Stores<TDataFormats, TRelations>>[]
  /**
   * Optional alternative `SimplePgClient` to use, different from the one initially provided
   * to create the TsPgOrm instance.
   */
  db?: SimplePgClient,
}
