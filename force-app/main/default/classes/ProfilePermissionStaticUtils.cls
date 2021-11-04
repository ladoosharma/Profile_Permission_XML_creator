/*******************************************************************************************
* @Name         ProfilePermissionStaticUtils 
* @Author       Gaurav Sharma <gs97197@gmail.com>
* @Date         17/10/2021
* @Group        NA
* @Description  This class is utility class for storing static variables
*******************************************************************************************/
/* MODIFICATION LOG
* Version          Developer          Date               Description
*-------------------------------------------------------------------------------------------
*  1.0              Gaurav Sharma      17/10/2021         Initial Creation                                                      
*******************************************************************************************/
public with sharing class ProfilePermissionStaticUtils {
    /**
     * This string will be used for retrieval request to SOAP endpoint
     */
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
    /**
     * This string will be used for retrieval request to SOAP endpoint
     * This will be the items which needs to be retrieved
     */
    public static String RETRIEVE_REQUEST_ITEM ='<met:types>'+
                                                    '<met:members>{{_ELEMENT_ITEM}}</met:members>'+
                                                    '<met:name>{{_ELEMENT_NAME}}</met:name>'+
                                                '</met:types>';
    /**
     * This string a memeber which needs to be retrieved
     */
    public static String MEMBER_TAG = '<met:members>{{_ELEMENT_ITEM}}</met:members>';
    /**
     * This string will be used for multiple item retrieval request to SOAP endpoint
     * This will be the items which needs to be retrieved
     */
    public static String RETRIEVE_MULTIPLE_REQUEST_ITEM ='<met:types>'+
                                                    '{{_ELEMENT_ITEM}}'+
                                                    '<met:name>{{_ELEMENT_NAME}}</met:name>'+
                                                '</met:types>';
    /**
     * This string will be used for retrieval request status check to SOAP endpoint
     */
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
    /**
     * This string will be used for fetching all list of metadata(Profile/Permission)
     */
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
    /**
     * variable which stores body xml for fetching all list of metadata(Profile/Permission)
     */
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
    /**
     * variable which stores body xml for deploying metadata(Profile/Permission)
     */
    public static String DEPLOY_REQUEST_XML_BODY = '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:met="http://soap.sforce.com/2006/04/metadata">'+
    '<soapenv:Header>'+
       '<met:SessionHeader>'+
          '<met:sessionId>{{_SESSION_ID}}</met:sessionId>'+
        '</met:SessionHeader>'+
    '</soapenv:Header>'+
    '<soapenv:Body>'+
       '<met:deploy>'+
          '<met:ZipFile>{{_ZIP_CONTENT}}</met:ZipFile>'+
          '<met:DeployOptions>'+
            //  '<met:allowMissingFiles></met:allowMissingFiles>'+
            //  '<met:autoUpdatePackage></met:autoUpdatePackage>'+
             '<met:checkOnly>{{_CHECK_ONLY}}</met:checkOnly>'+
            //  '<met:ignoreWarnings></met:ignoreWarnings>'+
            //  '<met:performRetrieve></met:performRetrieve>'+
            //  '<met:purgeOnDelete></met:purgeOnDelete>'+
            //  '<met:rollbackOnError></met:rollbackOnError>'+
            //  '<met:runTests></met:runTests>'+
            //  '<met:singlePackage></met:singlePackage>'+
            //  '<met:testLevel></met:testLevel>'+
          '</met:DeployOptions>'+
       '</met:deploy>'+
    '</soapenv:Body>'+
 '</soapenv:Envelope>';
 public static String DEPLOY_STATUS_BODY = '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:met="http://soap.sforce.com/2006/04/metadata">'+
 '<soapenv:Header>'+
    '<met:SessionHeader>'+
       '<met:sessionId>{{_SESSION_ID}}</met:sessionId>'+
    '</met:SessionHeader>'+
 '</soapenv:Header>'+
 '<soapenv:Body>'+
    '<met:checkDeployStatus>'+
       '<met:asyncProcessId>{{_DEPLOY_ID}}</met:asyncProcessId>'+
       '<met:includeDetails>true</met:includeDetails>'+
    '</met:checkDeployStatus>'+
 '</soapenv:Body>'+
'</soapenv:Envelope>';
}