'use strict';

const $                  = require('jquery'); 
const FileSaver          = require('file-saver');

const THREE              = require('three');

const bind               = require('./misc/bind');

const AdvancedEditor     = require('./tools/advanced_editor');
const VoxelAddTool       = require('./tools/voxel_add_tool');
const VoxelDeleteTool    = require('./tools/voxel_delete_tool');
const VoxelEditTool      = require('./tools/voxel_edit_tool');
const VoxelSmoothingTool = require('./tools/voxel_smoothing_tool');
const AnchorTool         = require('./tools/anchor_tool');
const ForceTool          = require('./tools/force_tool');
const TextureEditor      = require('./tools/texture_editor');
const PrimitivesSelector = require('./tools/primitives_selector');

module.exports = (function() {

  function Controls(renderer, voxelGrid, simulation) {
    bind(this);

    this.renderer = renderer;
    this.voxelGrid = voxelGrid;
    this.simulation = simulation;

    this.pressedKeys = {};

    $('#voxel-import-json-btn').click(this.importJson);
    $('#voxel-export-json-btn').click(this.exportJson);
    $('#voxel-export-obj-btn').click(this.exportObj);

    this.tools = {
      'add-tool': new VoxelAddTool(this.renderer, this.voxelGrid),
      'delete-tool': new VoxelDeleteTool(this.renderer, this.voxelGrid),
      'edit-tool': new VoxelEditTool(this.renderer, this.voxelGrid),
      'smoothing-tool': new VoxelSmoothingTool(this.renderer, this.voxelGrid),
      'anchor-tool': new AnchorTool(this.renderer, this.voxelGrid),
      'force-tool': new ForceTool(this.renderer, this.voxelGrid, this.simulation)
    };

    $('.voxel-tool-btn').click(this.selectTool);
    $('#voxel-mirror-btn').click(this.toggleMirrorMode);
    $('.voxel-stiffness-btn').click(this.selectStiffness);
    $('.voxel-stiffness-pattern-btn').click(this.selectStiffnessPattern);

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);

    this.activeTool = this.tools['add-tool'];
    this.activeTool.activate();

    this.mirrorMode = false;

    $('#import-cellsize').blur(this.parseGridSettings);
    $('#import-thickness').blur(this.parseGridSettings);

    this.advancedEditor = new AdvancedEditor([
      this.tools['add-tool'],
      this.tools['delete-tool'],
      this.tools['edit-tool'],
      this.tools['smoothing-tool']
    ]);

    this.textureEditor = new TextureEditor([
      this.tools['add-tool'],
      this.tools['delete-tool'],
      this.tools['edit-tool'],
      this.tools['smoothing-tool']
    ]);

    this.primitivesSelector = new PrimitivesSelector([
      this.tools['add-tool'],
      this.tools['delete-tool'],
      this.tools['edit-tool'],
      this.tools['smoothing-tool']
    ]);

    this.parseGridSettings();
  }

  Controls.prototype.selectTool = function(evt) {
    const toolName = typeof evt == 'string' ? evt : evt.currentTarget.id.slice(6, -4);

    $('.voxel-tool-btn').removeClass('active');
    $('#voxel-' + toolName + '-btn').addClass('active');

    this.activeTool.deactivate();
    this.activeTool = this.tools[toolName];
    this.activeTool.activate();
  }

  Controls.prototype.toggleMirrorMode = function(evt) {
    this.mirrorMode = !this.mirrorMode;

    this.tools['add-tool'].setMirrorMode(this.mirrorMode);
    this.tools['delete-tool'].setMirrorMode(this.mirrorMode);
    this.tools['edit-tool'].setMirrorMode(this.mirrorMode);

    if (this.mirrorMode) {
      $('#voxel-mirror-btn').addClass('active');
    } else {
      $('#voxel-mirror-btn').removeClass('active');
    }
  }

  Controls.prototype.alterMouseEvents = function() {
    this.tools['smoothing-tool'].alterMouseEvents();
  }

  Controls.prototype.setCuboidMode = function(cuboidMode) {
    this.cuboidMode = cuboidMode;

    this.tools['add-tool'].setCuboidMode(this.cuboidMode);
    this.tools['delete-tool'].setCuboidMode(this.cuboidMode);
    this.tools['edit-tool'].setCuboidMode(this.cuboidMode);

    if (this.cuboidMode) {
      $('#voxel-cuboid-btn').addClass('active');
    } else {
      $('#voxel-cuboid-btn').removeClass('active');
    }
  }

  Controls.prototype.toggleAddDelete = function() {
    switch (this.activeTool) {
      case this.tools['add-tool']:
        this.selectTool('delete-tool');
        break;
      case this.tools['delete-tool']:
        this.selectTool('add-tool');
        break;
    }
  }

  Controls.prototype.selectStiffness = function(evt) {
    const stiffness = parseInt(evt.currentTarget.dataset.stiffness) / 100.0;
    const key = evt.currentTarget.dataset.type; //else from

    $(".voxel-stiffness-btn[data-type='"+key+"']").removeClass('active');
    $(evt.currentTarget).addClass('active');

    this.tools['add-tool'].stiffness[key] = stiffness;
    this.tools['edit-tool'].stiffness[key] = stiffness;
  }

  Controls.prototype.selectStiffnessPattern = function(evt) {
    const pattern = evt.currentTarget.dataset.type;

    $(".voxel-stiffness-pattern-btn").removeClass('active');
    $(evt.currentTarget).addClass('active');

    if(pattern !== "normal") {
      $(".second-stiffnes-value-panel").addClass('active');
    } else {
      $(".second-stiffnes-value-panel").removeClass('active');
    }

    this.tools['add-tool'].stiffness.pattern = pattern;
    this.tools['edit-tool'].stiffness.pattern = pattern;
  }

  Controls.prototype.importJson = function() {
    $('<input type="file" >').on('change', function(event) {
      var file = event.target.files[0];
      if (file) {
        var reader = new FileReader();
        reader.onload = function() {
          this.voxelGrid.importJson(reader.result);
        }.bind(this);
        reader.readAsText(file);
      }
    }.bind(this)).click();
  }

  Controls.prototype.exportJson = function() {
    var name = "exportJson";
    var blob = this.voxelGrid.exportJson();
    FileSaver.saveAs(blob, name + '.json');
  }

  Controls.prototype.exportObj = function() {
    var name = "export";
    var blob = this.voxelGrid.exportObj();
    FileSaver.saveAs(blob, name + '.obj');
  }

  Controls.prototype.onKeyDown = function(evt) {
    if (this.pressedKeys[evt.keyCode]) {
      return;
    }

    this.pressedKeys[evt.keyCode] = true;

    switch (evt.keyCode) {
      case 16:
        this.toggleAddDelete();
        break;
      case 17:
        this.setCuboidMode(false);
        this.alterMouseEvents();
        break;
    }
  }

  Controls.prototype.onKeyUp = function(evt) {
    delete this.pressedKeys[evt.keyCode];

    switch (evt.keyCode) {
      case 16:
        this.toggleAddDelete();
        break;
      case 17:
        this.setCuboidMode(true);
        this.alterMouseEvents();
        break;
      case 27:
        this.activeTool.reset();
        break;
    }
  }

  Controls.prototype.parseGridSettings = function() {
    let cellSize = parseFloat($('#import-cellsize').val());
    let minThickness = parseFloat($('#import-thickness').val());
    this.voxelGrid.setMinThickness(minThickness/cellSize);
  };

  return Controls;

})();
