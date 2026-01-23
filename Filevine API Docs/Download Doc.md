Get Document Download Locator
get
https://api.filevineapp.com/fv-app/v2/Documents/{documentId}/locator
Request
Enter Bearer followed by the access token

An API key is a token that you provide when making API calls. Include the token in a header parameter called Authorization.

Example: Authorization: 123

Path Parameters
documentId
string
required
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
DocumentId
object
Native
integer<int32>
The numeric identifier by which the object is known by the Filevine system

Partner
string
An identifier by which the object is known by the third party system.

Links
dictionary[string, string]
ContentType
string
Url
string
AntivirusScanResult
array[object]
DocID
integer<int32>
required
ThreatDetected
boolean
required
DateScanned
string<date-time>
required
Message
string
VirusName
string
DocKey
string
VersionKey
string