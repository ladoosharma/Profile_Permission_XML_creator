/*******************************************************************************************
* @Name         ProfilePermissionHTTPHandler 
* @Author       Gaurav Sharma <gs97197@gmail.com>
* @Date         17/10/2021
* @Group        NA
* @Description  This class is hadler class for all rest based calls
*******************************************************************************************/
/* MODIFICATION LOG
* Version          Developer          Date               Description
*-------------------------------------------------------------------------------------------
*  1.0              Gaurav Sharma      17/10/2021         Initial Creation                                                      
*******************************************************************************************/
public with sharing class ProfilePermissionHTTPHandler {
    //endpoint of the rest call
    private String endpoint;
    //map of headers 
    private Map<String, Object> headers;
    //body of the http request
    private String body;
    /**************************************************************************************
    * @Description  This is the constructor of the class
    * @Param		String endpoint- endpoint where needs to be called, Map<String, Object> headers- header specified on the call
    *                , String body- body of the request
    * @Return       None
    * @Example     
    * new ProfilePermissionHTTPHandler('/endpoint/xyz/', Map<String, Object> headers , '{xyz:'test}')
    */
    public ProfilePermissionHTTPHandler(String endpoint, Map<String, Object> headers , String body) {
        this.endpoint = endpoint;
        this.headers = headers;
        this.body = body;
    }
    /**************************************************************************************
    * @Description  This method will do callout to the endpoint
    * @Param		String actionType- eg POST, GET, Boolean isSOAPCall- if the call is to REST or SOAP endpoint
    * @Return       HttpResponse - Response object
    * @Example     
    * new ProfilePermissionHTTPHandler('/endpoint/xyz/', Map<String, Object> headers , '{xyz:'test}').callEndpoint('POST', true/false)
    */
    public HttpResponse callEndpoint(String actionType, Boolean isSOAPCall){
        Http http = new Http();
        HttpRequest request = new HttpRequest();
        if(headers != null){
            for(String header: headers.keyset()){
                request.setHeader(header, (String)headers.get(header));
            }
        }
        request.setEndpoint(endpoint);
        request.setMethod(actionType);
        if(!isSOAPCall){
            request.setHeader('Authorization', 'Bearer '+ getAuthorization());
        }
        if(!String.isBlank(body)){
            request.setBody(body);
        }
        HttpResponse response = http.send(request);
        return response;
    }
    /**************************************************************************************
    * @Description  This private method will do return session ID for the call
    * @Param		SNone
    * @Return       String -sessin ID
    * @Example     
    * NON callable
    */
    private String getAuthorization(){
        return Page.SessionIDHack.getContent().toString();
    }
}