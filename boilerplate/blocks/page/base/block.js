Caramel.block("page/base", {

    initialize:function (data) {

    },

    //the feilds that needs to be provided as inputs for this block
    getInputs:function () {
        return {
            title:null,
            bodyText:null,
            pagePath:null,
            body:null
        };
    },

    //The outputs of this block
    getOutputs:function (inputs) {
        return inputs;
    },

    //This block includes following static blocks
    getStaticBlocks:function () {
        return ["menu/left"];
    },

    //This block includes following defined blocks
    getInputBlocks:function () {
        return ["header", "body", "footer"];
    }
});
