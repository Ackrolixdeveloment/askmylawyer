#!/usr/bin/env node
/** Source-derived handover artifacts. Does not import app code or read credentials. */
const ts = require('typescript');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const backend = path.resolve(__dirname, '..');
const root = path.dirname(backend);
const output = path.join(root, 'docs/api');
const config = ts.readConfigFile(path.join(backend, 'tsconfig.json'), ts.sys.readFile);
const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, backend);
const program = ts.createProgram(parsed.fileNames, parsed.options);
const checker = program.getTypeChecker();
const files = program.getSourceFiles().filter(f => f.fileName.startsWith(path.join(backend, 'src/')));
const classes = files.flatMap(f => f.statements.filter(ts.isClassDeclaration));
const decorators = n => (ts.canHaveDecorators(n) ? ts.getDecorators(n) : []) || [];
const calls = n => decorators(n).map(d => d.expression).filter(ts.isCallExpression);
const named = (n, name) => calls(n).find(c => c.expression.getText() === name);
const literal = n => n && (ts.isStringLiteralLike(n) || ts.isNumericLiteral(n)) ? n.text : undefined;
const source = n => path.relative(root, n.getSourceFile().fileName).split(path.sep).join('/');
const line = n => n.getSourceFile().getLineAndCharacterOfPosition(n.getStart()).line + 1;
function declaration(n) {
  let s = checker.getSymbolAtLocation(n);
  if (s?.flags & ts.SymbolFlags.Alias) s = checker.getAliasedSymbol(s);
  return s?.declarations?.find(ts.isClassDeclaration);
}
const mounted = new Set(), modules = new Set();
function walkModule(cls) {
  if (!cls || modules.has(cls)) return;
  modules.add(cls);
  const meta = named(cls, 'Module')?.arguments[0];
  if (!meta || !ts.isObjectLiteralExpression(meta)) return;
  for (const prop of meta.properties) {
    if (!ts.isPropertyAssignment(prop) || !ts.isArrayLiteralExpression(prop.initializer)) continue;
    const key = prop.name.getText();
    for (const item of prop.initializer.elements) {
      const target = declaration(item);
      if (key === 'controllers' && target) mounted.add(target);
      if (key === 'imports' && target) walkModule(target);
    }
  }
}
walkModule(classes.find(c => c.name?.text === 'AppModule'));
if (mounted.size < 10) throw Error('Module discovery failed; refuse incomplete collection.');

function fieldsFor(param) {
  const type = checker.getTypeAtLocation(param);
  return checker.getPropertiesOfType(type).flatMap(symbol => {
    const node = symbol.valueDeclaration;
    if (!node || !ts.isPropertyDeclaration(node) || !node.getSourceFile().fileName.startsWith(path.join(backend, 'src/'))) return [];
    const validators = calls(node).filter(c => c.expression.getText() !== 'Transform').map(c => c.getText());
    const typeName = checker.typeToString(checker.getTypeOfSymbolAtLocation(symbol, node));
    const options = named(node, 'IsIn')?.arguments[0];
    const optional = !!node.questionToken || !!named(node, 'IsOptional') || !!node.initializer;
    return [{ name: symbol.name, type: typeName, optional, validators,
      choices: options && ts.isArrayLiteralExpression(options) ? options.elements.map(literal) : undefined,
      default: node.initializer?.getText(), source: source(node), line: line(node) }];
  });
}
function sample(f) {
  const n = f.name;
  if (f.choices?.length) return f.choices[0];
  if (n === 'email') return '{{email}}';
  if (n === 'password' || n === 'newPassword') return '{{password}}';
  if (n === 'otp' || n === 'code') return '{{otp}}';
  if (n === 'refreshToken') return '{{refreshToken}}';
  if (/token|secret|signature/i.test(n)) return `{{${n}}}`;
  if (/Id$/.test(n) || n === 'id') return `{{${n}}}`;
  if (/mobile|phone/i.test(n)) return '{{mobile}}';
  if (/scheduledFor|expectedUpdatedAt/.test(n)) return `{{${n}}}`;
  if (/email/i.test(n)) return 'person@example.invalid';
  if (/name/i.test(n)) return 'Local Test';
  if (/boolean/.test(f.type)) return false;
  if (/number/.test(f.type)) return Number(f.default) || 1;
  if (/\[\]/.test(f.type)) return [];
  if (f.type.startsWith('"')) return f.type.split('"')[1];
  return `{{${n}}}`;
}
const methods = { Get: 'GET', Post: 'POST', Put: 'PUT', Patch: 'PATCH', Delete: 'DELETE', Sse: 'GET', Head: 'HEAD', Options: 'OPTIONS' };
const routes = [];
for (const cls of mounted) {
  const prefix = literal(named(cls, 'Controller')?.arguments[0]) || '';
  for (const member of cls.members) {
    const route = calls(member).find(c => methods[c.expression.getText()]);
    if (!route || !ts.isMethodDeclaration(member)) continue;
    const kind = route.expression.getText();
    const suffix = literal(route.arguments[0]) || '';
    const guards = [...(named(cls, 'UseGuards')?.arguments || []), ...(named(member, 'UseGuards')?.arguments || [])].map(n => n.getText());
    const auth = guards.some(g => g.includes('AdminAuthGuard')) ? 'admin-cookie' : guards.some(g => g.includes('LawyerAuthGuard')) ? 'lawyer-bearer' : guards.some(g => g.includes('CustomerAuthGuard')) ? 'customer-bearer' : cls.name.text === 'RazorpayWebhookController' ? 'razorpay-signature' : 'public';
    const parameters = member.parameters.flatMap(p => calls(p).map(d => ({ kind: d.expression.getText(), name: literal(d.arguments[0]), type: p.type?.getText(), fields: ['Body','Query'].includes(d.expression.getText()) ? fieldsFor(p) : [] })));
    const interceptors = named(member, 'UseInterceptors');
    const uploads = [];
    for (const c of interceptors?.arguments || []) {
      if (!ts.isCallExpression(c)) continue;
      if (c.expression.getText() === 'FileInterceptor') uploads.push(literal(c.arguments[0]));
      if (c.expression.getText() === 'FileFieldsInterceptor' && ts.isArrayLiteralExpression(c.arguments[0])) {
        for (const field of c.arguments[0].elements) if (ts.isObjectLiteralExpression(field)) {
          const prop = field.properties.find(p => ts.isPropertyAssignment(p) && p.name.getText() === 'name');
          if (prop) uploads.push(literal(prop.initializer));
        }
      }
    }
    routes.push({ method: methods[kind], path: '/api/v1/' + [prefix, suffix].filter(Boolean).join('/'),
      controller: cls.name.text, handler: member.name.getText(), auth, guards,
      status: Number(literal(named(member, 'HttpCode')?.arguments[0])) || (kind === 'Post' ? 201 : 200),
      stream: kind === 'Sse', uploads: uploads.filter(Boolean), parameters,
      source: source(member), line: line(member),
      description: ts.displayPartsToString(checker.getSymbolAtLocation(member.name)?.getDocumentationComment(checker)) });
  }
}
routes.sort((a,b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method));
const keys = routes.map(r => r.method + ' ' + r.path);
if (new Set(keys).size !== keys.length) throw Error('Duplicate API route discovered.');
const revision = createHash('sha256').update(JSON.stringify(routes)).digest('hex');
const variables = new Set(['baseUrl','email','password','otp','mobile','customerToken','lawyerToken','refreshToken','id','allowLiveWrites']);
const folders = new Map();
for (const r of routes) {
  const pathVariables = [...r.path.matchAll(/:([A-Za-z]+)/g)].map(m => m[1]);
  pathVariables.forEach(v => variables.add(v));
  const query = r.parameters.filter(p => p.kind === 'Query').flatMap(p => p.name ? [{key:p.name,value:`{{${p.name}}}`,disabled:true}] : p.fields.map(f => ({key:f.name,value:String(sample(f)),disabled:f.optional,description:`${f.type}; ${f.validators.join('; ')}`})));
  const bodyFields = r.parameters.filter(p => p.kind === 'Body').flatMap(p => p.fields);
  const requiredBody = Object.fromEntries(bodyFields.filter(f => !f.optional).map(f => [f.name, sample(f)]));
  const role = r.path.includes('/admin/') ? 'admin' : r.path.includes('/lawyer/') ? 'lawyer' : 'customer';
  for (const field of ['email','password','mobile']) if (Object.hasOwn(requiredBody,field)) requiredBody[field]=`{{${role}${field[0].toUpperCase()+field.slice(1)}}}`;
  if (Object.hasOwn(requiredBody, 'refreshToken')) requiredBody.refreshToken = `{{${role}RefreshToken}}`;
  const urlPath = r.path.replace(/^\/api\/v1\//,'').replace(/:([A-Za-z]+)/g, (_,v) => `{{${v}}}`);
  const summary = [`Source: ${r.source}:${r.line} (${r.controller}.${r.handler})`, `Auth: ${r.auth}. Expected success status: ${r.status}.`, r.description,
    r.stream ? 'SSE stream; this request does not terminate like JSON. Use a streaming client.' : '',
    r.path.includes('webhook') ? 'Requires exact raw JSON and x-razorpay-signature. Do not replay production events without approval.' : '',
    'Examples are source-derived templates, not proof of a completed workflow. Fill placeholders and inspect DTO/service rules.',
    ...r.parameters.filter(p => ['Body','Query','Param'].includes(p.kind)).map(p => `${p.kind} ${p.name || p.type}:\n${p.fields.map(f => `- ${f.name}${f.optional?' (optional)':''}: ${f.type}; ${f.validators.join('; ')}`).join('\n')}`)].filter(Boolean).join('\n\n');
  const request = { method:r.method, auth:r.auth.endsWith('bearer') ? {type:'bearer',bearer:[{key:'token',value:r.auth.startsWith('lawyer')?'{{lawyerToken}}':'{{customerToken}}',type:'string'}]} : {type:'noauth'},
    header:r.parameters.filter(p=>p.kind==='Headers'&&p.name).map(p=>({key:p.name,value:`{{${p.name}}}`})), description:summary, url:{raw:`{{baseUrl}}/${urlPath}`,host:['{{baseUrl}}'],path:urlPath.split('/'),...(query.length?{query}:{})} };
  const activeQuery=query.filter(q=>!q.disabled);
  if(activeQuery.length)request.url.raw+='?'+activeQuery.map(q=>`${q.key}=${q.value.includes('{{')?q.value:encodeURIComponent(q.value)}`).join('&');
  if (r.uploads.length) request.body={mode:'formdata',formdata:[...bodyFields.map(f=>({key:f.name,value:String(sample(f)),type:'text',disabled:f.optional})),...r.uploads.map(key=>({key,type:'file',src:[],description:'Select a local file; see DTO and file-rules.ts for allowed formats/limits.'}))]};
  else if (bodyFields.length) { request.header.push({key:'Content-Type',value:'application/json'});request.body={mode:'raw',raw:JSON.stringify(requiredBody,null,2),options:{raw:{language:'json'}}}; }
  else if (!['GET','HEAD','DELETE'].includes(r.method)) request.body={mode:'raw',raw:'{}',options:{raw:{language:'json'}}};
  const events=[];
  if (/\/(customer|lawyer)\/auth\/.*(?:verify|google|apple|refresh)$/.test(r.path)) {
    const token = r.path.includes('/lawyer/') ? 'lawyerToken' : 'customerToken';
    events.push({listen:'test',script:{type:'text/javascript',exec:[`if (pm.response.code >= 200 && pm.response.code < 300) { const d=pm.response.json(); if(d.accessToken) pm.environment.set('${token}', d.accessToken); if(d.refreshToken) pm.environment.set('${role}RefreshToken',d.refreshToken); }`]}});
  }
  const item={name:`${r.method} ${r.path}`,request,response:[],...(events.length?{event:events}:{})};
  const group=r.path.split('/')[3]||'health';const name=group==='admin'||group==='lawyer'||group==='customer'?`${group} / ${r.controller}`:r.controller;
  if(!folders.has(name))folders.set(name,[]);folders.get(name).push(item);
}
// Capture every placeholder so environments contain no hidden/missing variables.
const items=[...folders].map(([name,item])=>({name,item}));
for(const m of JSON.stringify(items).matchAll(/\{\{([^}]+)\}\}/g))variables.add(m[1]);
const defaults={baseUrl:'http://127.0.0.1:4400/api/v1',email:'',password:'',otp:'',mobile:'',allowLiveWrites:'false'};
const collection={info:{name:'AskMyLawyer — source-derived API collection',schema:'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',description:`Mounted NestJS routes. Contract fingerprint: ${revision}. Defaults to localhost; set credentials privately. Admin auth uses the Postman cookie jar. This is a manual diagnostic collection, not a bulk acceptance runner. Review writes before sending.`},
  variable:[...variables].sort().map(key=>({key,value:defaults[key]||'',type:'string'})),
  event:[{listen:'prerequest',script:{type:'text/javascript',exec:["const base=pm.variables.replaceIn('{{baseUrl}}');", "const local=/^https?:\\/\\/(localhost|127\\.0\\.0\\.1)(:\\d+)?\\//.test(base);", "if (!local && !['GET','HEAD','OPTIONS'].includes(pm.request.method) && pm.variables.get('allowLiveWrites') !== 'true') { throw new Error('Remote writes disabled. Review environment and explicitly set allowLiveWrites=true only for an authorized action.'); }"]}}],item:items};
const environment={name:'AskMyLawyer — LOCAL (fill secrets privately)',values:[...variables].sort().map(key=>({key,value:defaults[key]||'',enabled:true,type:/password|token|secret|otp/i.test(key)?'secret':'default'})),_postman_variable_scope:'environment'};
const stagingEnvironment={...environment,name:'AskMyLawyer — LOCAL STAGING (PostgreSQL 18)',values:environment.values.map(v=>({...v,value:v.key==='baseUrl'?'http://127.0.0.1:4500/api/v1':v.key==='adminEmail'?'admin@staging.askmylawyer.local':v.value}))};
const inventory=['# Generated API inventory','',`Contract fingerprint: \`${revision}\`. ${routes.length} mounted routes from ${mounted.size} controllers.`, '', 'Generated by `npm run docs:api` in backend. Do not edit this file directly. DTO/service behavior remains authoritative; see the JSON contract for fields/validators and the Postman collection for request templates.', '', '| Method | Route | Auth | Source |','|---|---|---|---|',...routes.map(r=>`| ${r.method}${r.stream?' (SSE)':''} | \`${r.path}\` | ${r.auth} | [${r.controller}.${r.handler}](../../${r.source}#L${r.line}) |`)].join('\n')+'\n';
fs.mkdirSync(output,{recursive:true});
const artifacts={'routes.json':JSON.stringify({contractFingerprint:revision,mountedControllers:[...mounted].map(c=>c.name.text).sort(),routes},null,2)+'\n','AskMyLawyer.postman_collection.json':JSON.stringify(collection,null,2)+'\n','Local.postman_environment.json':JSON.stringify(environment,null,2)+'\n','LocalStaging.postman_environment.json':JSON.stringify(stagingEnvironment,null,2)+'\n','INVENTORY.md':inventory};
if(process.argv.includes('--check')) {
  const stale=Object.entries(artifacts).filter(([name,text])=>!fs.existsSync(path.join(output,name))||fs.readFileSync(path.join(output,name),'utf8')!==text).map(([name])=>name);
  if(stale.length)throw Error('Stale generated API docs: '+stale.join(', '));
}else for(const [name,text] of Object.entries(artifacts))fs.writeFileSync(path.join(output,name),text);
console.log(`${process.argv.includes('--check')?'Verified':'Generated'} ${routes.length} routes from ${mounted.size} mounted controllers; contract ${revision.slice(0,12)}.`);
