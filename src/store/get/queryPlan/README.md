This is the Query Planner for the `get` and `getMany` store functions.

Very briefly, the Query Planner works like so:

* It breaks down a request to `get` or `getMany` into a single-root Directed Acyclical Graph (DAG) of "Data Nodes".
* Each Data Node represents a node of the recursive "GetFunctionOptions" data structure that `get` and `getMany` accepts.
* Data Nodes can either be plural or non-plural, depending on if they represent a "to-many" side of a Relation.
* All Plural Data Nodes and the root Data Node of the DAG become the new root Data Node of a "Query Node".
* Each Query Node represents a single query that is ran against the database.
* All non-plural Data Node children of a Query Node's root Data Node are grouped into that Query Node. These are called "non-root Data Nodes".
* We now a hyper-DAG, that is to say we have a DAG of Query Nodes, and each Query Node is also a DAG. A DAG inside a DAG.
* The DAG of Query Nodes is recursively executed, which each Query Node converted to SQL, queried on the database, and then any values required for it's child Query Nodes extracted and used to execute it's child Query Nodes.
* This ensures that the minimum number of queries is ran against the database.
* With the resulting rows obtained for each Query Node, "results folding" occurs.
* Results folding is the recursive nesting of the flat data obtained for each Query Node into a singular nested data structure required to match the structure of the original options supplied to `get` or `getMany`.
* It is worth noting that there is only a trivial difference between `get` and `getMany`.