/* eslint-disable @typescript-eslint/no-explicit-any  */

/**
 * These generic types and helpers can be used to strongly type useReducer scenarios
 * Reference: https://patrickdesjardins.com/blog/typescript-with-strong-typed-action-when-using-usereducer-of-react-hooks
 */

// Create an action with a payload
export interface ActionsWithPayload<TypeAction, TypePayload> {
  type: TypeAction
  payload: TypePayload
}

// Create an action that does not have a payload
export interface ActionsWithoutPayload<TypeAction> {
  type: TypeAction
}

// A very general type that means to be "an object with a many field created with createActionPayload and createAction
interface ActionCreatorsMapObject {
  [key: string]: (
    ...args: any[]
  ) => ActionsWithPayload<any, any> | ActionsWithoutPayload<any>
}

/**
 * Use this Type to merge several action object that has field created with createActionPayload or createAction
 * E.g. type ReducerWithActionFromTwoObjects = ActionsUnion<typeof ActionsObject1 & typeof ActionsObject2>;
 */
export type ActionsUnion<A extends ActionCreatorsMapObject> = ReturnType<
  A[keyof A]
>

// Create an action that has a strongly typed string literal name with a strongly typed payload
export function createActionPayload<TypeAction, TypePayload>(
  actionType: TypeAction
): (payload: TypePayload) => ActionsWithPayload<TypeAction, TypePayload> {
  return (p: TypePayload): ActionsWithPayload<TypeAction, TypePayload> => {
    return {
      payload: p,
      type: actionType,
    }
  }
}

// Create an action with no payload
export function createAction<TypeAction>(
  actionType: TypeAction
): () => ActionsWithoutPayload<TypeAction> {
  return (): ActionsWithoutPayload<TypeAction> => {
    return {
      type: actionType,
    }
  }
}
