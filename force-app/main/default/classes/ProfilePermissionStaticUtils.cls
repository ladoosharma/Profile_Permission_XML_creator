public with sharing class ProfilePermissionStaticUtils {
    public static String RETRIEVE_REQUEST_BODY = '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:met="http://soap.sforce.com/2006/04/metadata">'+
                                                    '<soapenv:Header>'+
                                                        '<met:SessionHeader>'+
                                                        '<met:sessionId>{{_SESSION_ID}}</met:sessionId>'+
                                                    '</met:SessionHeader>'+
                                                    '</soapenv:Header>'+
                                                        '<soapenv:Body>'+
                                                            '<met:retrieve>'+
                                                                '<met:retrieveRequest>'+
                                                                '<met:apiVersion>52.0</met:apiVersion>'+
                                                                    '<met:unpackaged>'+
                                                                    '{{_REQUEST_ITEM}}'+
                                                                    '<met:version>52.0</met:version>'+
                                                                    '</met:unpackaged>'+
                                                                '</met:retrieveRequest>'+
                                                            '</met:retrieve>'+
                                                        '</soapenv:Body>'+
                                                    '</soapenv:Envelope>';

    public static String RETRIEVE_REQUEST_ITEM ='<met:types>'+
                                                    '<met:members>{{_ELEMENT_ITEM}}</met:members>'+
                                                    '<met:name>{{_ELEMENT_NAME}}</met:name>'+
                                                '</met:types>';
    public static String RETRIEVE_REQUEST_STATUS = '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:met="http://soap.sforce.com/2006/04/metadata">'+
                                                    '<soapenv:Header>'+
                                                    '<met:SessionHeader>'+
                                                        '<met:sessionId>{{_SESSION_ID}}</met:sessionId>'+
                                                    '</met:SessionHeader>'+
                                                    '</soapenv:Header>'+
                                                    '<soapenv:Body>'+
                                                    '<met:checkRetrieveStatus>'+
                                                        '<met:asyncProcessId>{{_PROCESS_ID}}</met:asyncProcessId>'+
                                                        '<met:includeZip>true</met:includeZip>'+
                                                    '</met:checkRetrieveStatus>'+
                                                    '</soapenv:Body>'+
                                                '</soapenv:Envelope>';
    public static String METADATA_LIST_XML_STRING = '<?xml version="1.0" encoding="utf-8"?>'+
    '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tns="http://soap.sforce.com/2006/04/metadata">'+
                                        '<soapenv:Header>'+
                                        '<tns:SessionHeader>'+
                                        '<tns:sessionId>{{_accessToken}}</tns:sessionId>'+
                                        '</tns:SessionHeader>'+
                                        '</soapenv:Header>'+
                                        '<soapenv:Body>'+
                                        '<tns:listMetadata>'+
                                        '<listMetadataQuery>'+
                                        '<type>{{_metadataType}}</type>'+
                                        '<folder></folder>'+
                                        '</listMetadataQuery>'+
                                        '<asOfVersion>{{_apiVersion}}</asOfVersion>'+
                                        '</tns:listMetadata>'+
                                        '</soapenv:Body>'+
                                        '</soapenv:Envelope>';
    public static String METADATA_LIST_PROFILE_XML_STRING = '<?xml version="1.0" encoding="utf-8"?>'+
                                                            '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tns="http://soap.sforce.com/2006/04/metadata">'+
                                                            '<soapenv:Header>'+
                                                            '<tns:SessionHeader>'+
                                                            '<tns:sessionId>{{_accessToken}}</tns:sessionId>'+
                                                            '</tns:SessionHeader>'+
                                                            '</soapenv:Header>'+
                                                            '<soapenv:Body>'+
                                                            '<tns:listMetadata>'+
                                                            '<listMetadataQuery>'+
                                                            '<type>Profile</type>'+
                                                            '<folder></folder>'+
                                                            '</listMetadataQuery>'+
                                                            '<listMetadataQuery>'+
                                                            '<type>PermissionSet</type>'+
                                                            '<folder></folder>'+
                                                            '</listMetadataQuery>'+
                                                            '<asOfVersion>52.0</asOfVersion>'+
                                                            '</tns:listMetadata>'+
                                                            '</soapenv:Body>'+
                                                            '</soapenv:Envelope>';
}