------------------------------------------------
-- This is a SQL "notepad" that demonstrates examples of each combination
-- of many-to-many or not and range-constrained or not.
------------------------------------------------

select * from "user"

select * from "user_group"

select * from user_to_user_group

select * from "image"

select * from "image" where creator_user_id = 2

------------------------------------------------
-- non-many-to-many, non-range-constrained
------------------------------------------------
select
-- Root data node columns
"1".uuid "1.uuid", "1".date_created "1.dateCreated", "1".file_name "1.fileName",
-- Root data node linked field column
"1".creator_user_id "1.creatorUserId",
-- To-one related data columns
"2".id "2.id", "2".name "2.name"
-- Root from
from "image" "1"
-- To-one related data left joins
left join "user" "2" on "2".id = "1"."creator_user_id"
-- Linked field value where clause
where "1".creator_user_id = any (values (1),(2),(3))
-- 	Root data node query SQL
and "1".date_deleted is null
order by "1".id

------------------------------------------------
-- non-many-to-many, range-constrained
------------------------------------------------
select
-- Root data node columns
"1"."uuid" "1.uuid", "1"."file_name" "1.fileName",
-- Root data node linked field column
"1"."creator_user_id" "1.creatorUserId",
-- To-one related data columns
"2".id "2.id", "2".name "2.name"
-- Root from
from "user" "_0"
-- Range-constraint part of root "from"
left join lateral (
	select
	"uuid", "date_created", "file_name", "creator_user_id"
	from "image" "1"
	where "1".creator_user_id = "_0"."id"
	-- 	Root data node query SQL
	and "1"."date_deleted" is null
	order by "1".id
	limit 2
	offset 2
) as "1" on "1"."creator_user_id" = "_0"."id"
-- To-one related data left joins
left join "user" "2" on "2".id = "1"."creator_user_id"
-- Linked field value where clause
where "1"."creator_user_id" = any (values (1),(2),(3))

------------------------------------------------
-- many-to-many, non-range-constrained
------------------------------------------------
select
-- Root data node columns
"1".id "1.id", "1".uuid "1.uuid", "1".name "1.name", "1".date_created "1.dateCreated",
-- Root data node join table columns
"u2ug".user_id "u2ug.user_id", "u2ug".user_group_id "u2ug.user_group_id",
-- To-one related data columns
"2".id "2.id", "2".name "2.name"
-- Root from
from "user_to_user_group" "u2ug"
join "user_group" "1" on "1".id = "u2ug".user_group_id
-- To-one related data left joins
left join "user" "2" on "2".id = "1"."id"
-- Linked field value where clause
where "u2ug".user_id = any (values (1),(2),(3))
-- 	Root data node query SQL
and "1".date_deleted is null
order by "1".id

------------------------------------------------
-- many-to-many, range-constrained
------------------------------------------------
select
-- Root data node columns
"1"."id" "1.id", "1"."uuid" "1.uuid", "1"."name" "1.name", "1"."date_created" "1.dateCreated",
-- Root data node join table columns
"1"."u2ug.user_id" "u2ug.user_id", "1"."u2ug.user_group_id" "u2ug.user_group_id",
-- To-one related data columns
"2".id "2.id", "2".name "2.name"
-- Root from
from "user" "_0"
-- Range-constraint part of root "from"
join lateral (
	select
	"1".id "id", "1".uuid "uuid", "1".name "name", "1".date_created "date_created",
	"u2ug".user_id "u2ug.user_id", "u2ug".user_group_id "u2ug.user_group_id"
	from "user_to_user_group" "u2ug"
	join "user_group" "1" on "1".id = "u2ug"."user_group_id"
	where "u2ug"."user_id" = "_0"."id"
	-- Root data node query SQL
	and "1".date_deleted is null
	order by "1".id
	limit 2
	offset 2
) as "1" on "1"."u2ug.user_id" = "_0"."id"
-- To-one related data left joins
left join "user" "2" on "2".id = "1"."id"
-- Linked field value where clause
where "_0"."id" = any (values (1),(2),(3))


select
"0".uuid "0.uuid", "0".title "0.title", "0".date_created "0.dateCreated", "0".creator_user_id "0.creatorUserId",
"1".id "1.id", "1".name "1.name",
"2".user_id "2.userId", "2".street_address "2.streetAddress", "2".post_code "2.postCode"
from "article" "0"
left join "user" "1" on "1".id = "0".creator_user_id
left join "user_address" "2" on "2".user_id = "1".id
where "0".date_deleted is null
limit 1

select * from article

select
"3".id "3.id", "3".created_by_user_id "3.createdByUserId", "3".image_id "3.imageId", "3".title "3.title",
"4".id "4.id", "4".file_name "4.fileName", "4".created_by_user_id "4.createdByUserId"
from "recipe" "3"
left join "image" "4" on "4".id = "3".image_id
where "3".created_by_user_id = any (values (1),(2),(3))