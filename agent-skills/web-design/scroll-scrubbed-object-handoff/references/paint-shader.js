// Folvra adaptation of ThreeUI's Ashen One studio, shared by the plates and mint.
export const paintLighting = `
  vec3 studioDirection(vec2 aim) {
    return normalize(vec3(aim.x*1.15, .48+aim.y*.85, .9));
  }
  vec3 illuminate(vec3 paint, vec3 N, vec2 aim, float plane, float roughness,
                  float metal, float visibility) {
    vec3 L=studioDirection(aim), V=normalize(vec3(aim*.17,1.));
    float ndl=max(dot(N,L),0.), nv=max(dot(N,V),0.);
    vec3 R=reflect(-V,N), H=normalize(L+V);
    float rough=clamp(max(roughness,length(fwidth(N))*.50),.085,.98);
    float nh=max(dot(N,H),0.), alignment=max(dot(R,L),0.);
    float fres=pow(1.-nv,5.);
    float tight=pow(alignment,mix(102.,5.,rough*rough));
    float broad=pow(max(dot(R,normalize(vec3(.76,.32,.47))),0.),6.);
    float bounce=pow(max(dot(R,normalize(vec3(-.54,-.62,.54))),0.),5.);
    vec3 env=vec3(.006,.005,.004)+vec3(.15,.15,.145)*broad+vec3(.20,.12,.055)*bounce;
    float brass=smoothstep(.04,.29,paint.r-paint.b);
    vec3 f0=mix(vec3(.042),mix(vec3(.56,.57,.58),vec3(.89,.72,.36),brass),metal);
    float spec=(tight*2.0+pow(nh,mix(176.,12.,rough))*.88)*(1.-rough*.88);
    vec3 light=vec3(1.,.92,.79);
    // All layers use the same stage-coordinate band, so it continues across
    // the separate pauldron plates, brass pins and foil impressions.
    float sweep=exp(-pow((plane-aim.x*.61+aim.y*.19)/(.068+.11*rough),2.));
    float foil=metal*(1.-rough)*sweep;
    vec3 col=paint*mix(.59+.79*ndl,.59+.51*ndl,metal)*mix(.68,1.,visibility);
    // Tarnished recesses in the painted plates reflect less than the raised polish.
    float polish=smoothstep(.008,.26,dot(paint,vec3(.2126,.7152,.0722)));
    float exposure=mix(.13,1.,polish)*mix(.45,1.,visibility);
    col+=f0*(env+light*spec*visibility)*(.72+.35*fres)*mix(1.,exposure,metal);
    col+=mix(vec3(.80,.51,.25),vec3(1.,.94,.77),nh)*foil*(.035+.16*nh)*exposure;
    vec3 gain=max(col-paint,0.);
    return max(vec3(0.),min(paint,col)+gain/(1.+1.3*gain));
  }
`;
