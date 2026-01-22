Get Folder Structure
get
https://api.filevineapp.com/fv-app/v2/Folders/list
Get entire folder structure for org or project

Request
Enter Bearer followed by the access token

An API key is a token that you provide when making API calls. Include the token in a header parameter called Authorization.

Example: Authorization: 123

Query Parameters
ascendingOrder
boolean
Default:
true
includeArchivedFolders
boolean
Default:
false
includeArchivedProjects
boolean
Default:
false
limit
integer<int32>
>= 0
<= 1000
Default:
1000
offset
integer<int32>
>= 0
Default:
0
projectId
string
Default:
null
requestedFields
string
When retrieving a list of items from an endpoint, you can specify the top-level fields returned for each item in that list.

For example, GET /contacts?requestedFields=firstname,lastname,age would return the list of contacts with each contact having only their first name, last name, and age as their fields.

Default:
*
Headers
x-fv-orgid
integer
required
The Org Id the requesting user belongs to

Default:
0
x-fv-userid
integer
required
The User Id of the requesting user

Default:
0
Responses
200
Body

application/json

application/json
Links
dictionary[string, string]
Count
integer<int32>
Offset
integer<int32>
LastID
integer<int32>
Limit
integer<int32>
HasMore
boolean
RequestedFields
string
Items
array[object]
FolderId
object
ParentId
object
ProjectId
object
Links
dictionary[string, string]
Name
string
IsArchived
boolean
