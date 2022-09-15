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
"_0".id "_0.id", "_0".name "_0.name",
-- Root data node columns
"1"."uuid" "1.uuid", "1"."file_name" "1.fileName",
-- Root data node linked field column
"1"."creator_user_id" "1.creatorUserId",
-- To-one related data columns
"2".id "2.id", "2".name "2.name"
-- Root from
from "user" "_0"
-- Range-constraint part of root "from"
join lateral (
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
where "_0"."id" = any (values (1),(2),(3))

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
"1".id "1.id", "1".uuid "1.uuid", "1".date_created "1.dateCreated", "1".date_deleted "1.dateDeleted", "1".name "1.name", "1".description "1.description", "1".image_id "1.imageId",
"1"."user_to_user_group.user_id" "user_to_user_group.user_id", "1"."user_to_user_group.user_group_id" "user_to_user_group.user_group_id"
from "user" "_0"
join lateral (
select
"1"."id" "id", "1"."uuid" "uuid", "1"."date_created" "date_created", "1"."date_deleted" "date_deleted", "1"."name" "name", "1"."description" "description", "1"."image_id" "image_id",
"user_to_user_group".user_id "user_to_user_group.user_id", "user_to_user_group".user_group_id "user_to_user_group.user_group_id"
from user_to_user_group "user_to_user_group"
join "user_group" "1" on "1".id = "user_to_user_group"."user_group_id"
where "user_to_user_group"."user_id" = "_0"."id"
limit 1 offset 0
) as "1" on "1"."user_to_user_group.user_id" = "_0"."id"
where "_0"."id" = any (values (1),(2),(3))