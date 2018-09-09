@function can-query-logic.prototype.identityKeys identityKeys
@parent can-query-logic.prototype


@description Return the identity keys.

@signature `queryLogic.identityKeys()`

  Return the identity keys used to identity instances associated with the query logic:

  ```js
  import {QueryLogic} from "can";

  const queryLogic = new QueryLogic({
      identity: ["_id"]
  });

  console.log( queryLogic.identityKeys() ); //-> ["_id"]
  ```
  @codepen

  @return {Array<String>} An Array of the identity keys.
