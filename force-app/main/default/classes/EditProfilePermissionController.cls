public with sharing class EditProfilePermissionController {
    private static final string OBJ_INFO_ENDPOINT = '/services/data/v49.0/sobjects/';
    private static final String RETRIEVE_RESULT_ENDPOINT = 'services/Soap/m/50.0/';
    
    @AuraEnabled(cacheable= true)
    public static List<String> getAllObjects(){
        try {
            List<String> returnList = new List<String>();
            returnList.addAll(Schema.getGlobalDescribe().keyset());
            return returnList;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
    @AuraEnabled
    public static String getObjectInfos(String objName){
        try {
            ProfilePermissionHTTPHandler handler = new ProfilePermissionHTTPHandler(URL.getSalesforceBaseUrl().toExternalForm()+OBJ_INFO_ENDPOINT+objName+'/describe',
                                                                                    null, '');
                                                                                    

            HttpResponse response= handler.callEndpoint('GET');
            return response.getBody();
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
}