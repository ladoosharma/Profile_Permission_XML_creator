public with sharing class ProfilePermissionHTTPHandler {
    private String endpoint;
    private Map<String, Object> headers;
    private String body;
    public ProfilePermissionHTTPHandler(String endpoint, Map<String, Object> headers , String body) {
        this.endpoint = endpoint;
        this.headers = headers;
        this.body = body;
    }

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

    private String getAuthorization(){
        return Page.SessionIDHack.getContent().toString();
    }
}