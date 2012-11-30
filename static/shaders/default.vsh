attribute vec3 a_position;
attribute vec3 a_normal;
attribute vec3 a_texcoord;
uniform mat4 worldTransform;
uniform mat4 modelTransform;
uniform mat3 normalMatrix;
uniform vec3 matColor;
varying vec3 normal;
varying vec3 color;

void main() {
    gl_Position = worldTransform * modelTransform * vec4(a_position, 1);
    normal = normalMatrix * a_normal;
    color = matColor;
}
