EquationsGeneratorController.$inject =
  ['$q',
  'EquationsGeneratorService',
  'PrintService',
  'TreasureMapDrawingService',
  'LanguageService',
  'HTMLService'];

function EquationsGeneratorController
    ($q,
      EquationsGeneratorService,
      PrintService,
      TreasureMapDrawingService,
      LanguageService,
      HTMLService)
{
  var equationsGenerator = this;

  equationsGenerator.generationAllowed = true;

  // Complexity setting objects

  equationsGenerator.easyComplexity = 1;

  equationsGenerator.advancedComplexity={
    complexity:10,
    equationsAmount:6,
    fieldSize:5,
    operations: [
    {code: "+", value: "+", selected: true, available:true},
    {code: "-", value: "-", selected: true, available:true},
    {code: "*", value: "*", selected: false, available:true},
    {code: ":", value: ":", selected: false, available:true}
  ]};

  // Objects to be generated for the map (language independent)
  equationsGenerator.steps = []; // pure numbers - steps to the goal
  equationsGenerator.targetCoordinates = []; // four random targets
  equationsGenerator.equations = []; // equations generated by the service
  equationsGenerator.currentTarget; // coordinates of the stone, that is the goal
  equationsGenerator.errorMessage="";

  equationsGenerator.generationOptions =
  {
    pageOrientation: 'landscape',
    answerGeneration: true,
    nameDate: false
  };

  // Language related objects
  equationsGenerator.language="ru";
  equationsGenerator.STRINGS = LanguageService.findDictionary(equationsGenerator.language);

  // canvas objects for pdf generationOptions

  equationsGenerator.studentPage;
  equationsGenerator.teacherPage;

  // complexity is changed on the complexity control
  // May be removed to the separate component. TBD.

  equationsGenerator.changeComplexity = function ()
  {
    switch (equationsGenerator.easyComplexity)
    {
      case ('1'): // easy, addition and substraction 0-10
        equationsGenerator.advancedComplexity.complexity=10;
        equationsGenerator.advancedComplexity.equationsAmount=6;
        equationsGenerator.advancedComplexity.fieldSize=5;
        for (var i=0; i<equationsGenerator.advancedComplexity.operations.length; i++)
        {
          if ((equationsGenerator.advancedComplexity.operations[i].value==="*") ||
            (equationsGenerator.advancedComplexity.operations[i].value===":"))
              {
                equationsGenerator.advancedComplexity.operations[i].selected = false;
              }

          if ((equationsGenerator.advancedComplexity.operations[i].value==="+") ||
            (equationsGenerator.advancedComplexity.operations[i].value==="-"))
              {
                equationsGenerator.advancedComplexity.operations[i].selected = true;
            }
        }
        equationsGenerator.generationAllowed=true;
        equationsGenerator.errorMessage="";
        break;

      case ('2'): //moderate, addition and substraction up to 25
        equationsGenerator.advancedComplexity.complexity=25;
        equationsGenerator.advancedComplexity.equationsAmount=8;
        equationsGenerator.advancedComplexity.fieldSize=10;
        for (var i=0; i<equationsGenerator.advancedComplexity.operations.length; i++)
        {
          if ((equationsGenerator.advancedComplexity.operations[i].value==="*") ||
            (equationsGenerator.advancedComplexity.operations[i].value===":"))
              {
                equationsGenerator.advancedComplexity.operations[i].selected = false;
              }

          if ((equationsGenerator.advancedComplexity.operations[i].value==="+") ||
            (equationsGenerator.advancedComplexity.operations[i].value==="-"))
              {
                equationsGenerator.advancedComplexity.operations[i].selected = true;
              }
        }
        equationsGenerator.generationAllowed=true;
        equationsGenerator.errorMessage="";
        break;

      case ('3'): // hard, all arithmetic operations, up to 25
        equationsGenerator.advancedComplexity.complexity=25;
        equationsGenerator.advancedComplexity.equationsAmount=10;
        equationsGenerator.advancedComplexity.fieldSize=10;
        for (var i=0; i<equationsGenerator.advancedComplexity.operations.length; i++)
        {
           equationsGenerator.advancedComplexity.operations[i].selected = true;
        }
        equationsGenerator.generationAllowed=true;
        equationsGenerator.errorMessage="";
        break;

      case ('100'): // custom selection
        if (Number(equationsGenerator.advancedComplexity.complexity)===10)
        {
          equationsGenerator.advancedComplexity.fieldSize=5;
          for (var i=0; i<equationsGenerator.advancedComplexity.operations.length; i++)
          {
            if ((equationsGenerator.advancedComplexity.operations[i].value==="*") ||
              (equationsGenerator.advancedComplexity.operations[i].value===":"))
                {
                  equationsGenerator.advancedComplexity.operations[i].available = false;
                  equationsGenerator.advancedComplexity.operations[i].selected = false;
                }
          }

        }
        if (Number(equationsGenerator.advancedComplexity.complexity)===25)
        {
          equationsGenerator.advancedComplexity.fieldSize=10;
          for (var i=0; i<equationsGenerator.advancedComplexity.operations.length; i++)
          {
            if ((equationsGenerator.advancedComplexity.operations[i].value==="*") ||
              (equationsGenerator.advancedComplexity.operations[i].value===":"))
                {
                  equationsGenerator.advancedComplexity.operations[i].available = true;
                  }
          }
      }
      equationsGenerator.alterOperations();

        break;
    }
    EquationsGeneratorService.changeComplexity();
  }

  equationsGenerator.alterOperations = function()
  {
  var operationSelected = false;
    for (var i = 0; i < equationsGenerator.advancedComplexity.operations.length; i++)
    {
      if (equationsGenerator.advancedComplexity.operations[i].selected)
      {
        operationSelected = true;
      }
    }

    if (operationSelected === false)
    {
      equationsGenerator.generationAllowed=false;
      equationsGenerator.errorMessage=equationsGenerator.STRINGS.noOperationsMessage;
    } else
    {
      equationsGenerator.generationAllowed=true;
      equationsGenerator.errorMessage="";
    }
  }

  // Init targets and create equations set for selected complexity settings

    equationsGenerator.createEquations = function ()
    {
    var selectedOps=[];
    for (var i = 0; i < equationsGenerator.advancedComplexity.operations.length; i++)
    {
    if (equationsGenerator.advancedComplexity.operations[i].selected)
      {
        selectedOps.push(equationsGenerator.advancedComplexity.operations[i].code);
      }
    }

    if (selectedOps.length === 0)
    {
      equationsGenerator.errorMessage=equationsGenerator.STRINGS.noOperationsMessage;
      equationsGenerator.generationAllowed = false;
    } else {

      equationsGenerator.errorMessage="";
      equationsGenerator.generationAllowed = true;
      equationsGenerator.targetCoordinates = EquationsGeneratorService.initTargets(equationsGenerator.advancedComplexity.fieldSize);
      equationsGenerator.currentTarget =   equationsGenerator.targetCoordinates[Math.floor((Math.random() * 10)/3)];

      var options = {};

      if ((selectedOps.length === 1)&&(selectedOps[0]==="*"))
      {
        options = {noPrimes: true}
      }

      equationsGenerator.steps = EquationsGeneratorService.createPathToCurrentTarget
      (equationsGenerator.advancedComplexity.complexity,
       equationsGenerator.advancedComplexity.equationsAmount,
       equationsGenerator.advancedComplexity.fieldSize,
       equationsGenerator.currentTarget,
       options,
       equationsGenerator.language);

    //   console.log(equationsGenerator.steps);
       equationsGenerator.equations = [];

      var pr = EquationsGeneratorService.createEquationsFromPath(equationsGenerator.steps, equationsGenerator.advancedComplexity.complexity, equationsGenerator.language, selectedOps);

      pr.then(function (result)
      {
        equationsGenerator.equations = result;
        var promm = TreasureMapDrawingService.createStudentPage(equationsGenerator.targetCoordinates,
                                               equationsGenerator.advancedComplexity.fieldSize,
                                               equationsGenerator.equations,
                                               'landscape',
                                                equationsGenerator.language);
        promm.then(function (result) {
          equationsGenerator.studentPage = result;
          HTMLService.renderCanvas(equationsGenerator.studentPage);
        }, function (errorResponse) {
          console.log("Student page promise not returned");
          console.log(errorResponse);
          });
        },
      function (errorResponse) {
          console.log(errorResponse);
          console.log("Starting new generation");
          equationsGenerator.createEquations();
      });

      }
      };

  equationsGenerator.reset = function() {
    equationsGenerator.equations = [];
  }


  equationsGenerator.print = function ()
  {
    var prr = TreasureMapDrawingService.createStudentPage(equationsGenerator.targetCoordinates,
                                           equationsGenerator.advancedComplexity.fieldSize,
                                           equationsGenerator.equations,
                                           equationsGenerator.generationOptions.pageOrientation,
                                           equationsGenerator.language);

     prr.then(function(result)
     {
       equationsGenerator.studentPage = result;
       if (equationsGenerator.generationOptions.answerGeneration)
       {
        var prromise =  TreasureMapDrawingService.createTeacherPage(equationsGenerator.targetCoordinates,
                                                equationsGenerator.equations,
                                                equationsGenerator.steps,
                                                equationsGenerator.currentTarget,
                                                equationsGenerator.generationOptions.pageOrientation,
                                                equationsGenerator.language);

          prromise.then(function(result) {
          equationsGenerator.teacherPage = result;
          PrintService.print(equationsGenerator.studentPage, equationsGenerator.teacherPage, equationsGenerator.language, equationsGenerator.generationOptions.pageOrientation, equationsGenerator.generationOptions.nameDate);
        }, function (errorResponse) {
            console.log(errorResponse);
        });
      } else {
        PrintService.print(equationsGenerator.studentPage, null, equationsGenerator.language, equationsGenerator.generationOptions.pageOrientation, equationsGenerator.generationOptions.nameDate);
      }

       },
     function (errorResponse) {
         console.log(errorResponse);
     });
   }

  equationsGenerator.translate = function ()
  {
    equationsGenerator.STRINGS = LanguageService.findDictionary(equationsGenerator.language);
//    document.title = equationsGenerator.STRINGS.rechnenrucksack;

    if (equationsGenerator.steps.length>0)
    {
      var promise = TreasureMapDrawingService.createStudentPage(equationsGenerator.targetCoordinates,
                                             equationsGenerator.advancedComplexity.fieldSize,
                                             equationsGenerator.equations,
                                             'landscape',
                                             equationsGenerator.language);

      promise.then (function (result)
        {
          HTMLService.renderCanvas(result);
        }, function (error)
        {
          console.log(error);
        });

      }
   if (equationsGenerator.errorMessage!=="")
      {
        equationsGenerator.errorMessage = equationsGenerator.STRINGS.noOperationsMessage;
      }
   }

}
