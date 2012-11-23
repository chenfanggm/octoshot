
sh.Renderer = sh.Obj.extend({
    init: function() {
        this.root = new sh.SceneNode();
        this.persMatrix = mat4.create();

        this._objects = [];
        this._objectsById = {};
        this._bufferCache = {};
        this._programCache = {};
        this._behaviors = [];

        this._normalMatrix = mat3.create();
        this._worldTransform = mat4.create();

        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);

        var _this = this;
        sh.SceneNode.onAdd(function(obj) {
            _this._objects.push(obj);

            if(obj.id) {
                _this._objectsById[obj.id] = obj;
            }
        });

        sh.SceneNode.onRemove(function(obj) {
            _this._objects.splice(_this._objects.indexOf(obj), 1);

            if(obj.id) {
                _this._objectsById[obj.id] = null;
            }
        });
    },

    setCamera: function(camera) {
        this.camera = camera;
    },

    addObject: function(obj) {
        this.root.addObject(obj);
    },

    getObject: function(id) {
        return this._objectsById[id];
    },

    addBehavior: function(obj) {
        this._behaviors.push(obj);
    },

    perspective: function(fov, ratio, near, far) {
        mat4.perspective(fov, ratio, near, far, this.persMatrix);
    },

    update: function(dt) {
        this.camera.updateMatrices();
        this.updateObject(this.root, dt);

        for(var i=0, l=this._behaviors.length; i<l; i++) {
            this._behaviors[i].update(dt);
        }
    },

    updateObject: function(obj, dt, force) {
        obj.update(dt);

        var dirty = obj.needsWorldUpdate();
        obj.updateMatrices(force);

        var children = obj.children;
        for(var i=0, l=children.length; i<l; i++) {
            this.updateObject(children[i], dt, dirty || force);
        }
    },

    loadProgram: function(obj) {
        if(obj.shaders) {
            // Copy the shader array and sort it
            var sorted = obj.shaders.slice(0);
            sorted.sort();

            // If a program with the same shaders already exists, use it
            var cacheKey = sorted.join(';');
            if(this._programCache[cacheKey]) {
                return this._programCache[cacheKey];
            }

            var program = new sh.Program(sorted);
            this._programCache[cacheKey] = program;
            return program;
        }

        return null;
    },

    render: function() {
        if(!this.camera) {
            return;
        }

        mat4.multiply(this.persMatrix,
                      this.camera.inverseTransform,
                      this._worldTransform);

        var objs = this._objects;
        var lastProg = null;

        for(var i=0, l=objs.length; i<l; i++) {
            var obj = objs[i];

            if(!obj._program) {
                obj._program = this.loadProgram(obj);
            }

            var prog = obj._program;

            if(prog) {
                if(!lastProg || lastProg != prog) {
                    prog.use();
                    lastProg = prog;

                    if(prog.worldTransformLoc) {
                        gl.uniformMatrix4fv(prog.worldTransformLoc,
                                            false,
                                            this._worldTransform);
                    }
                }

                gl.uniformMatrix4fv(prog.modelTransformLoc,
                                    false,
                                    obj._realTransform);

                if(prog.normalLoc) {
                    mat4.toInverseMat3(obj._realTransform, this._normalMatrix);
                    mat3.transpose(this._normalMatrix);
                    
                    gl.uniformMatrix3fv(prog.normalLoc,
                                        false,
                                        this._normalMatrix);
                }

                obj.render();
            }
        }
    },

    bindAndEnableBuffer: function(program, buf, attrib) {
        //if(this._bufferCache[attrib] != buf) {
            gl.bindBuffer(gl.ARRAY_BUFFER, buf);
            var loc = gl.getAttribLocation(program, attrib);
            if(loc != -1) {
                gl.enableVertexAttribArray(loc);
                gl.vertexAttribPointer(loc, 3, gl.FLOAT, false, 0, 0);
            }

            this._bufferCache[attrib] = buf;
        //}
    }
});