Get Project List
get
https://api.filevineapp.com/fv-app/v2/Projects
Request
Enter Bearer followed by the access token

An API key is a token that you provide when making API calls. Include the token in a header parameter called Authorization.

Example: Authorization: 123

Query Parameters
createdSince
string
excludeArchived
boolean
Default:
false
hashtags
array[string]
A list of hashtags without the hash (#) (e.g., 'hashtags=foo,bar' or 'hashtags=foo&hashtags=bar'). When searching, the hashtag values are not case sensitive. Results will include one or more of the included hashtags (e.g., the example queries will return items that have either the '#foo' or '#bar' hashtags). NOTE: if hashes are desired they must be escaped as '%23' (e.g., 'hastags=%23foo').

incidentDate
string
A string representing a date. Use mm/dd/yyyy, mm-dd-yyyy, or yyyy-mm-dd. Example: 10/31/2002. If the date cannot be parsed, it will be ignored.

latestActivityBefore
string
A string representing a date. Use mm/dd/yyyy, mm-dd-yyyy, or yyyy-mm-dd. Example: 10/31/2002. If the date cannot be parsed, it will be ignored.

latestActivitySince
string
A string representing a date. Use mm/dd/yyyy, mm-dd-yyyy, or yyyy-mm-dd. Example: 10/31/2002. If the date cannot be parsed, it will be ignored.

limit
integer<int32>
>= 0
<= 1000
Default:
50
name
string
number
string
offset
integer<int32>
>= 0
Default:
0
orderBy
string
The order in which to sort the projects. Possible values are "asc" (ascending) and "desc" (descending).

phaseName
string
Filters results to projects with the given phase name. Matches exactly.

projectID
integer<int32>
requestedFields
string
When retrieving a list of items from an endpoint, you can specify the top-level fields returned for each item in that list.

For example, GET /contacts?requestedFields=firstname,lastname,age would return the list of contacts with each contact having only their first name, last name, and age as their fields.

Default:
*
searchTerm
string
sortBy
string
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
responses
/
200
/
Items[]
.
Number
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
ProjectId
object
ProjectTypeId
object
ClientId
object
PhaseId
object
Teams
array[object]
>= 1 items
ProjectTypeCode
string
RootDocFolderId
object
PhaseName
string
PhaseDate
string<date-time>
ClientName
string
ClientPictureURL
string
ClientPictureKey
string
ClientPictureS3Url
string
FirstPrimaryName
string
FirstPrimaryUsername
string
IsArchived
boolean
LastActivity
string<date-time>
UniqueKey
string
ProjectOrClientName
string
Hashtags
array[string]
Contacts
array[object]
OrgId
integer<int32>
ProjectEmailAddress
string
CreatedDate
string<date-time>
ProjectUrl
string
Links
dictionary[string, string]
ContactNumber
string
ClientFirstName
string
ClientMiddleName
string
ClientLastName
string
ProjectName
string
IncidentDate
string<date-time>
Description
string
Number
string