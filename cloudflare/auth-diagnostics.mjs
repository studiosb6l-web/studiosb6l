// Internal diagnostic only: no public route, no secrets, no user data.
// Can be exercised by automated tests and a privileged deployment inspector.
export function inspectAuthBindings(env={},request){
  return Object.freeze({
    d1Bound:typeof env?.DB?.prepare==='function',
    rateLimitBound:typeof env?.AUTH_RATE_LIMIT?.limit==='function',
    loginFlagEnabled:env?.LOGIN_ENABLED==='true',
    clientIpPresent:typeof request?.headers?.get==='function' && !!request.headers.get('CF-Connecting-IP'),
    emergencyStop:env?.STOP_SERVICE==='true'
  });
}
