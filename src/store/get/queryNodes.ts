import { queryNodeToSql } from './queryNodeToSql'
import { DataNode, DataNodes, NonRootDataNode, QueryNode, QueryNodes } from './types'

const determineNearestParentRootDataNode = (
  rootDataNodeIds: number[],
  dataNodes: DataNodes,
  dataNode: DataNode,
): DataNode => {
  let currentDataNode = dataNode.parent
  while (currentDataNode != null) {
    // If current node is a root node, return it
    if (rootDataNodeIds.indexOf(currentDataNode.id) !== -1)
      return currentDataNode
    // Else, walk backwards one step and repeat check
    currentDataNode = dataNodes[currentDataNode.parent.id]
  }

  // Should never happen
  return null
}

export const toQueryNodes = (dataNodes: DataNodes): QueryNodes => {
  const dataNodeList = Object.values(dataNodes)

  // Determine all the data nodes that are root data nodes (query node creators)
  const rootDataNodeIds: number[] = dataNodeList
    .filter(dataNode => dataNode.parent == null || dataNode.isPlural)
    .map(dataNode => dataNode.id)

  const dataNodeIdToQueryNode: { [dataNodeId: number]: QueryNode } = {}

  // Create a query node for each root data node
  const queryNodes: QueryNodes = {}
  rootDataNodeIds.forEach((rootDataNodeId, i) => {
    const queryNode: QueryNode = {
      id: i,
      dataNodes: { [rootDataNodeId]: dataNodes[rootDataNodeId] },
      nonRootDataNodes: {},
      rootDataNode: dataNodes[rootDataNodeId],
      parentQueryNodeLink: null,
      childQueryNodeLinks: [],
      toSql: linkedFieldValues => queryNodeToSql(queryNode, linkedFieldValues),
    }
    queryNodes[i] = queryNode
    dataNodeIdToQueryNode[rootDataNodeId] = queryNode
  })

  // Determine all the data nodes that are not root data nodes
  const nonRootDataNodes = Object.values(dataNodes)
    .filter(dataNode => dataNode.parent != null && !dataNode.isPlural) as NonRootDataNode[]

  // Add all non-root data nodes to the query node they belong in
  nonRootDataNodes.forEach(dataNode => {
    // Determine the nearest parent root data node id of the current data node
    const nearestParentRootDataNode = determineNearestParentRootDataNode(rootDataNodeIds, dataNodes, dataNode)
    if (nearestParentRootDataNode != null) {
      // Determine the query node of the nearest parent root data node.
      const queryNode = dataNodeIdToQueryNode[nearestParentRootDataNode.id]
      // Add the current data node to it's query node
      queryNode.dataNodes[dataNode.id] = dataNode
      queryNode.nonRootDataNodes[dataNode.id] = dataNode
      dataNodeIdToQueryNode[dataNode.id] = queryNode
    }
  })

  // Set query node parent and child links
  rootDataNodeIds.forEach(rootDataNodeId => {
    const rootDataNode = dataNodes[rootDataNodeId]
    const queryNodeOfRootDataNode = dataNodeIdToQueryNode[rootDataNodeId]

    const parentDataNodeInParentQueryNode = rootDataNode.parent
    if (parentDataNodeInParentQueryNode != null) {
      const parentQueryNode = dataNodeIdToQueryNode[parentDataNodeInParentQueryNode.id]

      queryNodeOfRootDataNode.parentQueryNodeLink = {
        parentDataNode: parentDataNodeInParentQueryNode,
        parentQueryNode,
      }

      parentQueryNode.childQueryNodeLinks.push({
        sourceDataNode: parentDataNodeInParentQueryNode,
        childQueryNode: queryNodeOfRootDataNode,
      })
    }
  })

  return queryNodes
}
