import {
  Stores,
  CreateUserRecordOptions,
  CreateImageRecordOptions,
  CreateArticleRecordOptions,
  CreateUserAddressRecordOptions,
  CreateUserGroupRecordOptions,
  CreateUserToUserGroupLinkOptions,
} from '../test/orm'

export const addSampleData = async (stores: Stores) => {
  // Add users
  const createUserRecordsOptions: CreateUserRecordOptions[] = [
    { name: 'User 1', email: 'user1@email.com', passwordHash: '123' },
    { name: 'User 2', email: 'user2@email.com', passwordHash: '456' },
    { name: 'User 3', email: 'user3@email.com', passwordHash: '789' },
  ]
  const users = await Promise.all(createUserRecordsOptions.map(stores.user.create))

  // Add images
  const createImageRecordsOptions: CreateImageRecordOptions[] = [
    { fileName: 'User 1 profile picture.png', creatorUserId: users[0].id },
    { fileName: 'User 2 profile picture.png', creatorUserId: users[1].id },
    { fileName: 'User 3 profile picture.png', creatorUserId: users[2].id },
    { fileName: 'funnycat.png', creatorUserId: users[0].id },
    { fileName: 'funnydog.png', creatorUserId: users[1].id },
    { fileName: 'funnygoat.png', creatorUserId: users[2].id },
    { fileName: 'funnycat2.png', creatorUserId: users[0].id },
    { fileName: 'funnydog2.png', creatorUserId: users[1].id },
    { fileName: 'funnygoat2.png', creatorUserId: users[2].id },
  ]
  const images = await Promise.all(createImageRecordsOptions.map(stores.image.create))

  // Add articles
  const createArticleRecordsOptions: CreateArticleRecordOptions[] = [
    { title: 'I am User 1', creatorUserId: users[0].id, thumbnailImageId: images[0].id },
    { title: 'I am User 2', creatorUserId: users[1].id, thumbnailImageId: images[1].id },
    { title: 'I am User 3', creatorUserId: users[2].id, thumbnailImageId: images[2].id },
  ]
  await Promise.all(createArticleRecordsOptions.map(stores.article.create))

  // Add user addresses
  const createUserAddressRecordsOptions: CreateUserAddressRecordOptions[] = [
    { userId: users[0].id, city: 'London', country: 'UK', postCode: 'SE11 119', streetAddress: '1 FooStreet Lane' },
    { userId: users[1].id, city: 'Madrid', country: 'Spain', postCode: 'SUI SUI', streetAddress: '2 FooStreet Lane' },
    { userId: users[2].id, city: 'Barcenlona', country: 'Spain', postCode: 'SUI SUI', streetAddress: '3 FooStreet Lane' },
  ]
  await Promise.all(createUserAddressRecordsOptions.map(stores.userAddress.create))

  // Add user groups
  const createUserGroupRecordsOptions: CreateUserGroupRecordOptions[] = [
    { name: 'User Group 1' },
    { name: 'User Group 2' },
    { name: 'User Group 3' },
  ]
  const userGroups = await Promise.all(createUserGroupRecordsOptions.map(stores.userGroup.create))

  const createUserToUserGroupLinkOptions: CreateUserToUserGroupLinkOptions[] = [
    { userId: users[0].id, userGroupId: userGroups[0].id },
    { userId: users[1].id, userGroupId: userGroups[1].id },
    { userId: users[2].id, userGroupId: userGroups[2].id },
    { userId: users[0].id, userGroupId: userGroups[1].id },
    { userId: users[0].id, userGroupId: userGroups[2].id },
  ]
  await Promise.all(createUserToUserGroupLinkOptions.map(stores.userIdToUserGroupId.create))
}
