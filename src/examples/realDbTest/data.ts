import {
  Stores,
  CreateUserRecordOptions,
  CreateImageRecordOptions,
  CreateArticleRecordOptions,
  CreateUserAddressRecordOptions,
  CreateUserGroupRecordOptions,
  CreateUserToUserGroupLinkOptions,
} from './orm'

export const addData = async (stores: Stores) => {
  // Add users
  const createUserRecordsOptions: CreateUserRecordOptions[] = [
    { name: 'user 1', email: 'user1@email.com', passwordHash: '123' },
    { name: 'user 2', email: 'user2@email.com', passwordHash: '456' },
    { name: 'user 3', email: 'user3@email.com', passwordHash: '789' },
  ]
  await Promise.all(createUserRecordsOptions.map(stores.user.create))

  // Add images
  const createImageRecordsOptions: CreateImageRecordOptions[] = [
    { fileName: 'funnydog.png', creatorUserId: 1 },
    { fileName: 'funnycat.png', creatorUserId: 2 },
    { fileName: 'user3avatar.png', creatorUserId: 3 },
  ]
  await Promise.all(createImageRecordsOptions.map(stores.image.create))

  // Add articles
  const createArticleRecordsOptions: CreateArticleRecordOptions[] = [
    { title: 'Here is a funny dog!', creatorUserId: 3, thumbnailImageId: 1 },
    { title: 'Here is a funny cat!', creatorUserId: 3, thumbnailImageId: 2 },
    { title: 'I am User 3', creatorUserId: 3, thumbnailImageId: 3 },
  ]
  await Promise.all(createArticleRecordsOptions.map(stores.article.create))

  // Add user addresses
  const createUserAddressRecordsOptions: CreateUserAddressRecordOptions[] = [
    { userId: 1, city: 'London', country: 'UK', postCode: 'SE11 119', streetAddress: '1 FooStreet Lane' },
    { userId: 2, city: 'Madrid', country: 'Spain', postCode: 'BON BON', streetAddress: '2 FooStreet Lane' },
    { userId: 3, city: 'Paris', country: 'France', postCode: 'SUI SUI', streetAddress: '3 FooStreet Lane' },
  ]
  await Promise.all(createUserAddressRecordsOptions.map(stores.userAddress.create))

  // Add user groups
  const createUserGroupRecordsOptions: CreateUserGroupRecordOptions[] = [
    { name: 'User group 1' },
    { name: 'User group 2' },
    { name: 'User group 3' },
  ]
  await Promise.all(createUserGroupRecordsOptions.map(stores.userGroup.create))

  const createUserToUserGroupLinkOptions: CreateUserToUserGroupLinkOptions[] = [
    { userId: 1, userGroupId: 1 },
    { userId: 2, userGroupId: 2 },
    { userId: 3, userGroupId: 3 },
  ]
  await Promise.all(createUserToUserGroupLinkOptions.map(stores['user.id <<-->> userGroup.id'].create))
}
