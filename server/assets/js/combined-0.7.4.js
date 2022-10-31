      data-template-region=${s} data-template-page=${a}>${o}</div>`}})(typeof exports==="undefined"?this["formattingService"]={}:exports);var verboseLogging=false;var isFrontEnd=true;if(typeof module!=="undefined"&&module.exports){isFrontEnd=false;var emitterService=require("./emitter.service");var globalService=require("./global.service");var pageBuilderService=require("./page-builder.service");var formService=require("./form.service");var helperService=require("./helper.service");var formattingService=require("./formatting.service");var _=require("underscore");var axios=require("axios");var fs=require("fs");var ShortcodeTree=require("shortcode-tree").ShortcodeTree;var chalk=require("chalk");var{GraphQLClient,gql,request}=require("graphql-request");const{User}=require("./typedefs/typedefs");verboseLogging=process.env.APP_LOGGING==="verbose";var log=console.log}else{const defaultOptions={headers:{},baseURL:globalService.baseUrl};let newAxiosInstance=axios.create(defaultOptions)}(function(e){var a="/graphql/";var t="";var n;var i;var r;e.startup=async function(){emitterService.on("requestBegin",async function(t){if(t){const e={headers:{},baseURL:globalService.baseUrl};if(t.req.signedCookies&&t.req.signedCookies.sonicjs_access_token){e.headers.Authorization=t.req.signedCookies.sonicjs_access_token}r=axios.create(e)}})},e.executeGraphqlQuery=async function(e){const t=`${globalService.baseUrl}/graphql`;const n=new GraphQLClient(t,{headers:{authorization:"Bearer MY_TOKEN"}});const i=n.request(e);return i},e.getAxios=function(){if(!r){const e={headers:{"Content-Type":"application/json"},withCredentials:true,baseURL:globalService.baseUrl,cookie:"sonicjs=s%3AMmvj7HC35YSG-RP1WEY6G3NS7mrSRFcN.EoldLokzB5IMX34xGLC2QwbU0HZn2dSFmtQ9BhPB26w"};let t=helperService.getCookie("sonicjs_access_token");if(t){e.headers.Authorization=t}r=axios.create(e);r.defaults.withCredentials=true}return r},e.userCreate=async function(e,t){};e.userUpdate=async function(e,t){let n=e.id;delete e.id;let i=JSON.stringify(e);let r=await this.getAxios().post(a,{query:`
        mutation{
          userUpdate( 
            id:"${n}", 
            profile:"""${i}""",
            sessionID:"${t}"){
              username
          }
        }
            `});return r.data},e.userDelete=async function(e,t){let n=`
      mutation{
        userDelete( 
          id:"${e}",
          sessionID:"${t}"){
            id
          }
      }
          `;let i=await this.getAxios().post(a,{query:n});return i.data.data.userDelete},e.rolesGet=async function(e){let t=await this.getAxios().post(a,{query:`
      {
        roles (sessionID:"${e}"){
          id
          data
        }
      }
        `});if(t.data.data.roles){return t.data.data.roles}},e.formGet=async function(e,t,n,i=false,r,c,o,s=false){let a=t?JSON.stringify(t):"";const l=`
      {
        form (contentType: "${e}",
        content: """${a}""",
        onFormSubmitFunction: """${n}""",
        returnModuleSettings: ${i},
        formSettingsId: "${r??""}",
        showBuilder: ${s},
        referringUrl: "${o}"){
          html
          contentType
        }
      }
        `;let u=await this.getAxios().post("/graphql",{query:l});if(u.data.data.form){return u.data.data.form}},e.getContent=async function(e){let t=await this.getAxios().post(a,{query:`
        {
          contents (sessionID:"${e}")
          {
            id
            contentTypeId
            data
            createdByUserId 
            createdOn
            lastUpdatedByUserId
            updatedOn
          }
        }
          `});if(t.data.data.contents){let e=t.data.data.contents;await formattingService.formatDates(e);await formattingService.formatTitles(e);return e}},e.getContentAdminCommon=async function(e){let t=await this.getContent(e);let n=_.sortBy(t,"updatedOn");let i=n.filter(e=>e.contentTypeId==="page"||e.contentTypeId==="blog");return i},e.getContentAdmin=async function(e){let t=await this.getContent(e);let n=_.sortBy(t,"updatedOn");return n},e.getContentByType=async function(e,t){let n=await this.getAxios().post(a,{query:`
        {
          contents (contentTypeId : "${e}", sessionID:"${t}") {
            id
            contentTypeId
            data
            createdOn
          }
        }
            `});return n.data.data.contents},e.getContentByTypeAndGroup=async function(e,t,n){let i=t?`, group : "${t}"`:"";let r=await this.getAxios().post(a,{query:`
        {
          contents (contentTypeId : "${e}" ${i}, sessionID:"${n}") {
            id
            contentTypeId
            data
            createdOn
          }
        }
            `});return r.data.data.contents},e.getPageTemplates=async function(e){let t=await this.getContentByType("page",e);let n=t.filter(e=>e.data.isPageTemplate);return n},e.contentTypeGet=async function(e,i){let r=await this.getAxios().post(a,{query:`
            {
                contentType(systemId:"${e}", sessionID:"${i.sessionID}") {
                  title
                  systemId
                  moduleSystemId
                  filePath
                  data
                  module
                }
              }
            `});if(!isFrontEnd){let e=await userService.getRoles(i.sessionID);await this.getPermissionsMatrix(r.data.data.contentType,e,i.sessionID);r.data.data.contentType.data=r.data.data.contentType.data??{};r.data.data.contentType.data.permissions=r.data.data.contentType.data?.permissions??[];r.data.data.contentType.data.permissions.map(e=>{e.roles.push("admin")});if(r.data.data.contentType.data.permissions.length){let e=await this.getContentByType("site-settings-acls",i.sessionID);let t=e[0].data.permissionAccessControls.map(e=>e.title);let n=i.user?.profile.roles;t.map(t=>{let e=r.data.data.contentType.data.permissions.find(e=>e.acl===t);if(e){r.data.data.contentType.acls=r.data.data.contentType.acls??{};r.data.data.contentType.acls[`can${helperService.capitalizeFirstLetter(t)}`]=_.intersection(e.roles,n).length!==0}})}}return r.data.data.contentType},e.getPermissionsMatrix=async function(i,e,t){let n=await this.getContentByType("site-settings-acls",t);let r=n[0].data.permissionAccessControls?.map(e=>e.title);i.permissionsMatrix={acls:r},i.permissionsMatrix.rows=e.map(n=>{let e=r.map(t=>{if(i.data?.permissions){let e=i.data.permissions.find(e=>e.acl===t);if(e?.roles.includes(n.key)||n.key==="admin"){return true}else{return false}}else{return false}});return{roleTitle:`${n.title} (${n.key})`,columns:e}})},e.contentTypesGet=async function(e){let t=await this.getAxios().post(a,{query:`
        {
          contentTypes (sessionID:"${e}") {
            title
            systemId
            moduleSystemId
            filePath
            data
          }
        }
          `});return t.data.data.contentTypes},e.queryfy=function(t){if(typeof t==="number"){return t}if(Array.isArray(t)){const e=t.map(e=>`${queryfy(e)}`).join(",");return`[${e}]`}if(typeof t==="object"){const e=Object.keys(t).map(e=>`${e}:${queryfy(t[e])}`).join(",");return`{${e}}`}return JSON.stringify(t)},e.contentTypeUpdate=async function(e,t){let n=JSON.stringify(e.data);let i=`
      mutation{
        contentTypeUpdate( 
          title:"${e.title}", 
          moduleSystemId:"${e.moduleSystemId}", 
          systemId:"${e.systemId}", 
          data:"""${n}""",
          sessionID:"${t}"){
            title
        }
      }
          `;let r=await this.getAxios().post(a,{query:i});return r.data.data.contentType},e.contentTypeDelete=async function(e,t){let n=JSON.stringify(e.data);let i=await this.getAxios().post(a,{query:`
        mutation{
          contentTypeDelete( 
            systemId:"${e}", sessionID:"${t}"){
              title
          }
        }
            `});return i.data.data.contentType},e.contentTypeCreate=async function(e,t){let n=`
      mutation{
        contentTypeCreate( 
          title:"${e.title}", 
          moduleSystemId:"${e.moduleSystemId}", 
          systemId:"${e.systemId}",
          sessionID:"${t}")
          {
            title
        }
      }
          `;let i=await this.getAxios().post(a,{query:n});return i.data.data.contentType},e.getContentTopOne=async function(e,t){let n=await this.getContentByType(e,t);if(n){return n[0]}else{throw new Error(`Could not find element getContentTopOne: ${e}, ${t}`)}},e.getContentByUrl=async function(e,t){let n=await this.getAxios().post(a,{query:`
            {
              content(url: "${e}", sessionID:"${t}") {
                id
                contentTypeId
                data
              }
            }
          `});if(n.data.data.content){return n.data.data.content}let i={data:{}};i.data.title="Not Found";i.data.body="Not Found";i.data.status="Not Found";i.url=e;return i},e.getContentByContentType=async function(e,t){let n=`
      {
        contents(contentTypeId: "${e}", sessionID:"${t}") {
          id
          contentTypeId
          data
          createdByUserId 
          lastUpdatedByUserId
          createdOn
          updatedOn
        }
      }
    `;let i=await this.getAxios().post(a,{query:n});if(i.data.data.contents){return i.data.data.contents}return"notFound"},e.getContentByContentTypeAndTitle=async function(e,t,n){let i=await this.getContentByContentType(e,n);if(i){let e=i.filter(e=>e.data.title.toLowerCase()===t.toLowerCase())[0];return e}},e.getContentByContentTypeAndTag=async function(e,t,n){let i=await this.getContentByContentType(e);if(i){let e=i.filter(e=>e.data.tags.includes(t.id));return e}},e.getContentByUrlAndContentType=async function(e,t,n){const i=`{"where":{"and":[{"url":"${t}"},{"data.contentType":"${e}"}]}}`;const r=encodeURI(i);let o=`${a}content?filter=${r}`;let s=await this.getAxios().get(o);if(s.data[0]){return s}return"not found"},e.editInstance=async function(e,t){let n=e.id;if(e.id){delete e.id}if(e.data&&e.data.id){n=e.data.id;delete e.data.id}let i=e.data;if(!i){i=e}let r=JSON.stringify(i);let o=`
      mutation{
        contentUpdate( 
          id:"${n}", 
          url:"${i.url}", 
          data:"""${r}""",
          sessionID:"${t}"){
            id
            url
            contentTypeId
        }
      }
          `;let s=await this.getAxios().post(a,{query:o});return s.data.data.contentUpdate},e.contentCreate=async function(e,t=true,n){if(e.data.contentType!=="page"&&e.data.contentType!=="blog"){if(t){e.data.url=helperService.generateSlugFromContent(e.data,true,true)}}let i=`
      mutation{
        contentCreate( 
          contentTypeId:"${e.data.contentType}", 
          url:"${e.data.url}", 
          data:"""${JSON.stringify(e.data)}""",
          sessionID:"${n}"){
            id
            url
            contentTypeId
        }
      }
          `;if(verboseLogging){console.log("contentCreate query ===>",i)}let r=await this.getAxios().post(a,{query:i});if(emitterService){emitterService.emit("contentCreated",r)}if(r.data.errors){console.error("contentCreate error ===>",JSON.stringify(r.data.errors))}if(verboseLogging){console.log("contentCreate result ===>",JSON.stringify(r.data))}return r.data.data.contentCreate};e.contentDelete=async function(e,t){let n=`
      mutation{
        contentDelete( 
          id:"${e}",
          sessionID:"${t}"){
            id
          }
      }
          `;let i=await this.getAxios().post(a,{query:n});return i};e.getContentById=async function(e,t){let n=await this.getAxios().post(a,{query:`
        {
          content(id: "${e}",
          sessionID:"${t}") {
            contentTypeId
            data
            id
            url
          }
        }
          `});if(n.data.data.content){n.data.data.content.data.id=n.data.data.content.id;n.data.data.content.data.contentType=n.data.data.content.contentTypeId;return n.data.data.content}},e.fileUpdate=async function(e,t,n){let i=await this.getAxios().post(a,{query:`
      mutation{
        fileUpdate( 
          filePath:"${e}", 
          fileContent:"""${t}""",
          sessionID:"${n}"
          )
          { 
            filePath 
          }
      }
          `});return i.data.data.fileUpdate},e.fileCreate=async function(e,t,n){let i=`
      mutation{
        fileCreate( 
          filePath:"${e}", 
          fileContent:"""${t}""",
          sessionID:"${n}"
          )
          { 
            filePath 
          }
      }
          `;let r=t.length;let o=await this.getAxios().post(a,{query:i});return o.data.data.fileUpdate},e.getView=async function(e,t,n,i){let r=await this.getAxios().post(a,{query:`
        {
          view(
            contentType:"${e}",
            viewModel: """${JSON.stringify(t)}""",
            viewPath:"${n}",
            sessionID:"${i}"
          ) {
          html
        }
      }
          `});if(r.data.data.view.html){return r.data.data.view.html}return notFound},e.asyncForEach=async function(t,n){for(let e=0;e<t.length;e++){await n(t[e],e,t)}},e.getImage=function(e){let t=this.getImageUrl(e);return`<img class="img-fluid rounded" src="${t}" />`},e.deleteModule=async function(e,t){let n=`
      mutation{
        moduleTypeDelete( 
          systemId:"${e}",
          sessionID:"${t}")
          { systemId }
      }
          `;let i=await this.getAxios().post(a,{query:n})},e.moduleCreate=async function(e,t){let n=await this.getAxios().post(a,{query:`
        mutation{
          moduleTypeCreate(
            title:"${e.data.title}", 
            enabled:${e.data.enabled}, 
            systemId:"${e.data.systemId}", 
            canBeAddedToColumn: ${e.data.canBeAddedToColumn},
            sessionID:"${t}"
            )
          {		
            title
            enabled
            systemId
            canBeAddedToColumn
          }
        }
          `});return n.data.data.fileUpdate},e.moduleEdit=async function(e,t){let n=await this.getAxios().post(a,{query:`
        mutation{
          moduleTypeUpdate(
            title:"${e.data.title}", 
            enabled:${e.data.enabled}, 
            systemId:"${e.data.systemId}", 
            icon:"${e.data.icon}", 
            canBeAddedToColumn: ${e.data.canBeAddedToColumn},
            singleInstance: ${e.data.singleInstance},
            version:"${e.data.version}"
            )
          {		
            title
            enabled
            systemId
            canBeAddedToColumn
          }
        }
          `});return n.data.data},e.mediaDelete=async function(e,t){let n=`
        mutation{
          mediaDelete( 
            id:"${e}",
            sessionID:"${t}"){
              id
            }
        }
            `;let i=await this.getAxios().post(a,{query:n});return i.data.data.mediaDelete};e.taxonomyGet=async function(t=null,n=null,i=null,e){taxonomies=await this.getContentByType("taxonomy");if(t){return taxonomies.find(e=>e.id===t)}else if(n){return taxonomies.find(e=>e.data.targetContentType===n)}else if(i){var r=_.filter(taxonomies,function(e){return _.some(e.data.terms,{urlRelative:i})});return r}else{return taxonomies}};e.getFiles=async function(){let e=[{title:"my image",filePath:"/images/test123.png"}];return e}})(typeof exports==="undefined"?this["dataService"]={}:exports);isBackEndMode=false;var axiosInstance;if(typeof module!=="undefined"&&module.exports){isBackEndMode=true;var dataService=require("./data.service");var emitterService=require("./emitter.service");var helperService=require("./helper.service");var globalService=require("./global.service");var multipart=require("connect-multiparty");var _=require("underscore");var appRoot=require("app-root-path");var fs=require("fs");var axios=require("axios");const ShortcodeTree=require("shortcode-tree").ShortcodeTree;const chalk=require("chalk");const log=console.log;const Formio={};const document={getElementById:{}}}else{}(function(v){v.startup=async function(e){emitterService.on("requestBegin",async function(t){if(t){const e={headers:{},baseURL:globalService.baseUrl};if(t.req.signedCookies&&t.req.signedCookies.sonicjs_access_token){e.headers.Authorization=t.req.signedCookies.sonicjs_access_token}axiosInstance=axios.create(e)}});emitterService.on("getRenderedPagePostDataFetch",async function(e){if(e&&e.page){e.page.data.editForm=await v.getForm(e.page.contentTypeId,null,"submitContent(submission)",undefined,undefined,e.req,e.req.url)}});e.get("/form",async function(e,t){t.send("form ok")});var t=require("connect-multiparty");e.use(t({uploadDir:`${appRoot.path}/server/temp`}));e.post("/video-upload",async function(e,t,n){let i=e.files.file.path;t.cookie("videoPath",i,{maxAge:9e5,httpOnly:true});t.send(i)})},v.getForm=async function(e,t,n,c=false,d,i,h,f=false){i.referringUrl=h;let r=t;if((typeof t==="string"||t instanceof String)&&t.length){r=JSON.parse(t)}let o;if(r&&r.data.contentType){o=await dataService.contentTypeGet(r.data.contentType.toLowerCase(),i)}else if(e){o=await dataService.contentTypeGet(e,i);if(d){o.data.components.unshift({type:"textfield",inputType:"text",key:"formSettingsId",defaultValue:d,hidden:false,input:true,customClass:"hide"})}if(c){const l=await dataService.contentTypeGet(`${e}-settings`,i);if(l&&l.title&&l.data){o=l}}}else{return}if(o&&emitterService){await emitterService.emit("formComponentsLoaded",{contentType:o,contentObject:r,req:i})}if(!n){n="editInstance(submission,true)"}const p=await v.getFormJson(o,r,f);let s="";let a={viewModel:{},viewPath:"/server/assets/html/form.html"};a.viewModel.onFormSubmitFunction=n;a.viewModel.editMode=false;let m={};if(r&&r.data){m=r.data;a.viewModel.editMode=true}if(o.data.states){if(a.viewModel.editMode&&o.data.states.editSubmitButtonText){const u=o.data.components.find(e=>e.key==="submit");if(u){u.label=o.data.states.editSubmitButtonText}}if(!a.viewModel.editMode&&o.data.states.addSubmitButtonText){const u=o.data.components.find(e=>e.key==="submit");if(u){u.label=o.data.states.addSubmitButtonText}}}a.viewModel.formJSON=JSON.stringify(p);a.viewModel.formValuesToLoad=JSON.stringify(m);a.viewModel.random=helperService.generateRandomString(8);a.viewModel.formioFunction=f?"builder":"createForm";a.viewPath="/server/assets/html/form.html";a.contentType="";let g=await dataService.getView("",a.viewModel,a.viewPath);if(g){s+=g}else{let e=await this.getFormTemplate();s+=e}return{html:s,contentType:o}},v.getFormJson=async function(e,t,n){let i=`${e.systemId}Form`;let r=await this.getFormSettings(e,t);let o=await this.getFormComponents(e,t,n);const s={components:o,name:i,settings:r};return s},v.getTemplate=async function(){let e=await this.getFormTemplate()},v.getFormTemplate=async function(){if(isBackEndMode){return this.getFormTemplateFileSystem()}else{let e=await globalService.axiosInstance.get("/html/form.html");return e.data}},v.getFormTemplateFileSystem=async function(){return new Promise((n,i)=>{let e="/server/assets/html/form.html";fs.readFile(e,"utf8",(e,t)=>{if(e){console.log(e);i(e)}else{n(t)}})})},v.getFormSettings=async function(e,t){let n={};if(isBackEndMode){n.recaptcha={isEnabled:"true",siteKey:process.env.RECAPTCHA_SITE_KEY}}return n},v.getFormComponents=async function(e,t,n){let i=e.data?.components;if(t){this.addBaseContentTypeFields(t.id,t.data.contentType,i)}else if(i&&!n){i.push({type:"hidden",key:"contentType",label:"contentType",defaultValue:e.systemId,hidden:false,input:true})}return i},v.addBaseContentTypeFields=function(e,t,n){if(n){n.push({type:"textfield",key:"id",label:"id",customClass:"hide",defaultValue:e,hidden:false,input:true})}};v.setFormApiUrls=async function(e){let t=sharedService.getBaseUrl();e.setProjectUrl(t);e.setBaseUrl(t)}})(typeof exports==="undefined"?this["formService"]={}:exports);$(document).ready(async function(){setupACEForSnippets()});async function setupACEForSnippets(){if(typeof ace==="undefined"){return}let r=$(".code-snippet");for(let i=0;i<r.length;i++){let e=r[i];let t=$(e);let n=t.data("type");var o=ace.edit(e);o.setTheme("ace/theme/chrome");o.session.setMode("ace/mode/"+n);o.renderer.setShowGutter(false);o.setOptions({maxLines:40,readOnly:true,highlightActiveLine:false,highlightGutterLine:false});o.renderer.$cursorLayer.element.style.display="none";o.autoIndent=true;o.setShowPrintMargin(false)}}$(document).ready(async function(){if($("[data-fancybox]").length){console.log("init fancybox");Fancybox.bind("[data-fancybox]",{})}});var initPhotoSwipeFromDOM=function(e){var u=function(e){var t=e.childNodes,n=t.length,i=[],r,o,s,a;for(var l=0;l<n;l++){r=t[l];if(r.nodeType!==1){continue}o=r.children[0];s=o.getAttribute("data-size").split("x");a={src:o.getAttribute("href"),w:parseInt(s[0],10),h:parseInt(s[1],10)};if(r.children.length>1){a.title=r.children[1].innerHTML}if(o.children.length>0){a.msrc=o.children[0].getAttribute("src")}a.el=r;i.push(a)}return i};var c=function e(t,n){return t&&(n(t)?t:e(t.parentNode,n))};var t=function(e){e=e||window.event;e.preventDefault?e.preventDefault():e.returnValue=false;var t=e.target||e.srcElement;var n=c(t,function(e){return e.tagName&&e.tagName.toUpperCase()==="FIGURE"});if(!n){return}var i=n.parentNode,r=n.parentNode.childNodes,o=r.length,s=0,a;for(var l=0;l<o;l++){if(r[l].nodeType!==1){continue}if(r[l]===n){a=s;break}s++}if(a>=0){d(a,i)}return false};var n=function(){var e=window.location.hash.substring(1),t={};if(e.length<5){return t}var n=e.split("&");for(var i=0;i<n.length;i++){if(!n[i]){continue}var r=n[i].split("=");if(r.length<2){continue}t[r[0]]=r[1]}if(t.gid){t.gid=parseInt(t.gid,10)}return t};var d=function(e,t,n,i){var r=document.querySelectorAll(".pswp")[0],o,s,a;a=u(t);s={galleryUID:t.getAttribute("data-pswp-uid"),getThumbBoundsFn:function(e){var t=a[e].el.getElementsByTagName("img")[0],n=window.pageYOffset||document.documentElement.scrollTop,i=t.getBoundingClientRect();return{x:i.left,y:i.top+n,w:i.width}}};if(i){if(s.galleryPIDs){for(var l=0;l<a.length;l++){if(a[l].pid==e){s.index=l;break}}}else{s.index=parseInt(e,10)-1}}else{s.index=parseInt(e,10)}if(isNaN(s.index)){return}if(n){s.showAnimationDuration=0}o=new PhotoSwipe(r,PhotoSwipeUI_Default,a,s);o.init()};var i=document.querySelectorAll(e);for(var r=0,o=i.length;r<o;r++){i[r].setAttribute("data-pswp-uid",r+1);i[r].onclick=t}var s=n();if(s.pid&&s.gid){d(s.pid,i[s.gid-1],true,true)}};initPhotoSwipeFromDOM(".home-gallery");window.onscroll=function(){};var navbar=document.getElementById("accordian-menu");if(navbar){var sticky=navbar.getBoundingClientRect().top-90}function scrollCheck(){if(navbar){if(window.pageYOffset>=sticky){navbar.classList.add("sticky")}else{navbar.classList.remove("sticky")}}}var sessionID;var axiosInstance;$(document).ready(async function(){setupSessionID();await setupAxiosInstance()});async function setupAxiosInstance(){let e=window.location.protocol+"//"+window.location.host+"/";let t=$("#token").val();const n={headers:{Authorization:`${t}`},baseUrl:e};axiosInstance=axios.create(n)}function setupSessionID(){sessionID=$("#sessionID").val()}function fullPageUpdate(e=undefined){console.log("refreshing page url",e);if(e){window.location.replace(e)}else{location.reload()}}async function openFormInModal(e,t,n){await openDetailForm(e,n);await openEditForm(e,n);await openDeleteForm(e,n);await openCreateForm(e,t)}async function openDetailForm(e,n){if(e==="detail"){let e=await dataService.getContentById(n);let t=e.data.body;$("#genericModal .modal-title").html(e.data.title);$("#formio").empty();$("#formio").html(t);$("#genericModal").appendTo("body").modal("show")}}async function openEditForm(n,i){if(n==="edit"){let e=await dataService.getContentById(i);let t=await dataService.formGet(e.contentTypeId,e,"await submitContent(submission);",undefined,undefined,$("#sessionID").val(),window.location.pathname);$("#genericModal .modal-title").text(helperService.titleCase(`${n} ${e.contentTypeId}`));$("#formio").empty();$("#formio").html(t.html);loadModuleSettingForm();$('input[name="data[title]"').focus();$("#genericModal").appendTo("body").modal("show")}}async function openDeleteForm(n,i){if(n==="delete"){let e=await dataService.getContentById(i);let t=JSON.stringify(e.data,null,4);t+=`<div><button class="mt-2 btn btn-danger" type="button"  onclick="return confirmDelete('${e.id}', 1)""><i class="bi bi-trash"></i> Confirm Delete</button></div>`;$("#genericModal .modal-title").text(helperService.titleCase(`${n} ${e.contentTypeId}`));$("#formio").empty();$("#formio").html(t);$("#genericModal").appendTo("body").modal("show")}}async function confirmDelete(e){dataService.contentDelete(e,$("#sessionID").val()).then(e=>{fullPageUpdate()})}async function openCreateForm(n,i){if(n==="create"){let e=await dataService.formGet(i,undefined,"await submitContent(submission);",undefined,undefined,$("#sessionID").val(),window.location.pathname);let t=helperService.titleCase(`${n} ${i}`);$("#genericModal .modal-title").text(t);$("#formio").empty();$("#formio").html(e.html);loadModuleSettingForm();$('input[name="data[title]"').focus();$("#genericModal").appendTo("body").modal("show")}}async function submitContent(submission,refresh=true,contentType="content",ignoreSuccessAction=false){console.log("Submission was made!",submission);let entity=submission.data?submission.data:submission;entity.contentType=entity.contentType??contentType;if(typeof formIsDirty!=="undefined"){formIsDirty=false}let result=await axios({method:"post",url:"/form-submission",data:{data:entity,url:window.location.pathname}});if(!ignoreSuccessAction){eval(result.data.successAction)}}async function editInstance(e,t,n="content",i){if(n==="user"){n="users"}await dataService.editInstance(e,sessionID).then(async function(e){console.log("editInstance --\x3e",e);removeDirty();if(e.contentTypeId==="page"&&!globalService.isBackEnd()){if(e.url){window.location.href=e.url}else{fullPageUpdate()}}else if(i){addGrowl(i)}else if(t){fullPageUpdate()}}).catch(function(e){console.log("editInstance",e)})}function removeDirty(){$(".submit-alert").remove();if(typeof formIsDirty!=="undefined"){formIsDirty=false}}async function createInstance(t,e=false,n="content"){console.log("payload",t);if(t.id||"id"in t){delete t.id}if(!t.data){let e={data:t};t=e}if(n==="Roles"){t=t.data}let i=await dataService.contentCreate(t);if(i&&i.contentTypeId==="page"){let e=globalService.isBackEnd();if(e){window.location.href=`/admin/content/edit/page/${i.id}`}else{window.location.href=t.data.url}}else if(e){fullPageUpdate()}return i}function postSubmissionSuccessMessage(e){let t=`<div>
  ${e}
  </div>
  <button class="btn btn-success mt-5" type="button" class="close" data-bs-dismiss="modal" aria-label="Close">
    <span aria-hidden="true">Ok</span>
  </button>`;$("#formio").empty();$("#formio").html(t)}function redirectToUrl(e){window.location.href=e}function addGrowl(e){$.bootstrapGrowl(e,{ele:"body",type:"info",offset:{from:"bottom",amount:20},align:"right",width:250,delay:3e3,allow_dismiss:false,stackup_spacing:10})}function vote(e,t){const n={id:e,vote:t};axiosInstance.post("/vote-api",n).then(function(e){$(`[data-vote-controls-id="${e.data.id}"] .voteUps`).text(e.data.data.voteUps);$(`[data-vote-controls-id="${e.data.id}"] .voteDowns`).text(e.data.data.voteDowns)}).catch(function(e){console.log(e)})}