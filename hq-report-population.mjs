// Shared reporting exclusions. No account classification or deletion writes.
const identifier=value=>{if(!/^[a-z_][a-z0-9_]*$/i.test(value))throw Error('invalid_sql_identifier');return value};
export function excludedEmailSql(email,tables){
 return `(lower(${email}) LIKE '%@example.invalid' OR lower(${email}) LIKE '%@example.test' OR lower(${email}) LIKE 'shiftsometimber+%@gmail.com' OR lower(${email}) IN ('appletest@shiftsometimber.co.uk','google-review@shiftsometimber.co.uk','shiftsometimber@gmail.com','obriens@sky.com','lindalouiseobrien@gmail.com')${tables.has('hq_users')?` OR EXISTS(SELECT 1 FROM hq_users staff WHERE lower(staff.email)=lower(${email}))`:''})`;
}
export function excludedMemberSql(tables,alias='u'){
 identifier(alias);
 return `(EXISTS(SELECT 1 FROM audit_log test WHERE test.user_id=${alias}.id AND test.action IN ('auth.commissioning_identity_verified','auth.commissioning_login_verified','auth.apple_review_fixture')) OR ${excludedEmailSql(alias+'.email',tables)})`;
}
export function commercePopulationSql(tables,alias,emailColumn){
 identifier(alias);identifier(emailColumn);
 return `NOT COALESCE(${excludedEmailSql(alias+'.'+emailColumn,tables)},0) AND NOT EXISTS(SELECT 1 FROM users population WHERE (population.id=${alias}.user_id OR lower(population.email)=lower(${alias}.${emailColumn})) AND ${excludedMemberSql(tables,'population')})`;
}
