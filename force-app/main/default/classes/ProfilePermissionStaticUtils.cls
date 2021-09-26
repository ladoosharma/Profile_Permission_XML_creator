public with sharing class ProfilePermissionStaticUtils {
    Public static String RETRIEVE_BODY = '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:met="http://soap.sforce.com/2006/04/metadata">'+
        '<soapenv:Header>'+
        '<met:CallOptions>'+
        '<met:client>?</met:client>'+
        '</met:CallOptions>'+
        '<met:SessionHeader>'+
        '<met:sessionId>{SESSION_ID}</met:sessionId>'+
        '</met:SessionHeader>'+
        '</soapenv:Header>'+
        '<soapenv:Body>'+
        '<met:retrieve>'+
        '<met:retrieveRequest>'+
        '<met:unpackaged>'+
        '<met:types>'+
        '<met:members>{ELEMENT_ITEM}</met:members>'+
        '<met:name>{ELEMENT_NAME}</met:name>'+
        '</met:types>'+
        '</met:unpackaged>'+
        '</met:retrieveRequest>'+
        '</met:retrieve>'+
        '</soapenv:Body>'+
        '</soapenv:Envelope>';
}