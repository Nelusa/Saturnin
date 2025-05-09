OPTION IMPORT;

DEFINE TABLE actor_type TYPE NORMAL SCHEMALESS PERMISSIONS NONE;
DEFINE FIELD name ON actor_type TYPE string PERMISSIONS FULL;

DEFINE TABLE robot TYPE NORMAL SCHEMALESS PERMISSIONS NONE;
DEFINE FIELD name ON robot TYPE string PERMISSIONS FULL;

DEFINE TABLE user TYPE NORMAL SCHEMALESS PERMISSIONS NONE;
DEFINE FIELD display_name ON user TYPE string PERMISSIONS FULL;

DEFINE TABLE group TYPE NORMAL SCHEMALESS PERMISSIONS NONE;
DEFINE FIELD display_name ON group TYPE string PERMISSIONS FULL;

DEFINE TABLE issue_state TYPE NORMAL SCHEMALESS PERMISSIONS NONE;
DEFINE FIELD title ON issue_state TYPE string PERMISSIONS FULL;

DEFINE TABLE project TYPE NORMAL SCHEMALESS PERMISSIONS NONE;
DEFINE FIELD title ON project TYPE string PERMISSIONS FULL;
DEFINE FIELD initial_issue_state ON project TYPE record<issue_state> PERMISSIONS FULL;
DEFINE INDEX code_unique ON project FIELDS code;

DEFINE TABLE issue TYPE NORMAL SCHEMALESS PERMISSIONS NONE;
DEFINE FIELD title ON issue TYPE option<string> PERMISSIONS FULL;
DEFINE FIELD summary ON issue TYPE option<string> PERMISSIONS FULL;
DEFINE FIELD description ON issue TYPE option<string> PERMISSIONS FULL;
DEFINE FIELD state ON issue TYPE record<issue_state> PERMISSIONS FULL;
DEFINE FIELD last_modified ON issue TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
DEFINE FIELD data ON issue TYPE option<object> PERMISSIONS FULL;

DEFINE TABLE external_link TYPE NORMAL SCHEMALESS PERMISSIONS NONE;
DEFINE FIELD url ON external_link TYPE string ASSERT string::is::url($value) PERMISSIONS FULL;

DEFINE TABLE file TYPE NORMAL SCHEMALESS PERMISSIONS NONE;
DEFINE FIELD s3_url ON file TYPE string ASSERT string::is::url($value) PERMISSIONS FULL;

DEFINE TABLE comment TYPE NORMAL SCHEMALESS PERMISSIONS NONE;
DEFINE FIELD author ON comment TYPE record<user | group | robot> PERMISSIONS FULL;
DEFINE FIELD created ON comment TYPE datetime READONLY VALUE time::now() PERMISSIONS FULL;
DEFINE FIELD data ON comment TYPE object PERMISSIONS FULL;
DEFINE FIELD text ON comment TYPE string PERMISSIONS FULL;

DEFINE TABLE project_actor TYPE RELATION IN project OUT user | robot | group SCHEMALESS PERMISSIONS NONE;
-- DEFINE FIELD in ON project_actor TYPE record<project> PERMISSIONS FULL;
-- DEFINE FIELD out ON project_actor TYPE record<user | robot | group> PERMISSIONS FULL;

DEFINE TABLE issue_actor TYPE RELATION IN issue_code OUT user | robot | group SCHEMALESS PERMISSIONS NONE;
-- DEFINE FIELD in ON issue_actor TYPE record<issue_code> PERMISSIONS FULL;
-- DEFINE FIELD out ON issue_actor TYPE record<user | robot | group> PERMISSIONS FULL;
DEFINE FIELD type ON issue_actor TYPE record<actor_type> PERMISSIONS FULL;

DEFINE TABLE issue_code TYPE RELATION IN issue OUT project SCHEMALESS PERMISSIONS NONE;
-- DEFINE FIELD in ON issue_code TYPE record<issue> PERMISSIONS FULL;
-- DEFINE FIELD out ON issue_code TYPE record<project> PERMISSIONS FULL;

DEFINE TABLE issue_comment TYPE RELATION IN issue OUT comment SCHEMALESS PERMISSIONS NONE;
-- DEFINE FIELD in ON issue_comment TYPE record<issue> PERMISSIONS FULL;
-- DEFINE FIELD out ON issue_comment TYPE record<comment> PERMISSIONS FULL;

DEFINE TABLE issue_external_link TYPE RELATION IN issue OUT external_link SCHEMALESS PERMISSIONS NONE;
-- DEFINE FIELD in ON issue_external_link TYPE record<issue> PERMISSIONS FULL;
-- DEFINE FIELD out ON issue_external_link TYPE record<external_link> PERMISSIONS FULL;

DEFINE TABLE issue_file TYPE RELATION IN issue OUT file SCHEMALESS PERMISSIONS NONE;
-- DEFINE FIELD in ON issue_file TYPE record<issue> PERMISSIONS FULL;
-- DEFINE FIELD out ON issue_file TYPE record<file> PERMISSIONS FULL;

DEFINE TABLE issue_link TYPE RELATION IN issue OUT issue SCHEMALESS PERMISSIONS NONE;
-- DEFINE FIELD in ON issue_link TYPE record<issue> PERMISSIONS FULL;
-- DEFINE FIELD out ON issue_link TYPE record<issue> PERMISSIONS FULL;
DEFINE FIELD type ON issue_link TYPE record<link_type> PERMISSIONS FULL;

DEFINE TABLE link_type TYPE NORMAL SCHEMALESS PERMISSIONS NONE;
DEFINE FIELD name ON link_type TYPE string PERMISSIONS FULL;
