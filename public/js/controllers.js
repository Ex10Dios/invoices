'use strict';

var InvoiceApp = angular.module ('InvoiceApp', ['ngRoute']);

InvoiceApp.config(['$routeProvider', function($routeProvide){
  $routeProvide
  .when('/', {
    templateUrl: 'assets/invoices/index.html',
    controller: 'InvoiceCtrl'
  })
  .when('/products', {
    templateUrl: 'assets/products/index.html',
    controller: 'ProductCtrl'
  })
  .when('/customers', {
    templateUrl: 'assets/customers/index.html',
    controller: 'CustomerCtrl'
  })
  .when('/invoices', {
    templateUrl: 'assets/invoices/index.html',
    controller: 'InvoiceCtrl'
  })
  .when('/invoices/new', {
    templateUrl: 'assets/invoices/new.html',
    controller: 'NewInvoiceCtrl'
  })
  .otherwise({
    templateUrl: 'assets/errors/404.html',
    controller: ''
  })
}]);

/* Controllers */
InvoiceApp.controller('InvoiceCtrl', ['$scope', '$http', '$location', function($scope, $http, $location){
  $http.get('/api/invoices').then(function(response){
    $scope.invoices = response.data;

    $http.get('/api/customers').then(function(response){
      $scope.customers = response.data;

      angular.forEach($scope.invoices, function(value, key) {
        $scope.invoices[key].customer = $scope.customers.find(function(element){
          return element.id == value.customer_id;
        })
      });
    },
    function(error){
      console.log(error);
      $scope.customers = [];
    });
  },
  function(error){
    console.log(error);
    $scope.invoices = [];
  });

  $scope.remove = function(id){
    $http.delete('/api/invoices/'+id).then(function(response){
      $scope.invoices = $scope.invoices.filter(function(item) {
        return item.id != id;
      });
    },
    function(error){
      console.log(error);
    });
  }

}]);

InvoiceApp.controller('ProductCtrl', ['$scope', '$http', '$location', function($scope, $http, $location){
  $http.get('/api/products').then(function(response){
    $scope.products = response.data;
  },
  function(error){
    console.log(error);
    $scope.products = [];
  });

  $scope.remove = function(id){
    $http.delete('/api/products/'+id).then(function(response){
      $scope.products = $scope.products.filter(function(item) {
        return item.id != id;
      });
    },
    function(error){
      console.log(error);
    });
  }
}]);

InvoiceApp.controller('CustomerCtrl', ['$scope', '$http', '$location', function($scope, $http, $location){
  $http.get('/api/customers').then(function(response){
    $scope.customers = response.data;
  },
  function(error){
    console.log(error);
    $scope.customers = [];
  });

  $scope.remove = function(id){
    $http.delete('/api/customers/'+id).then(function(response){
      $scope.customers = $scope.customers.filter(function(item) {
        return item.id != id;
      });
    },
    function(error){
      console.log(error);
    });
  }
}]);

InvoiceApp.controller('NewInvoiceCtrl', ['$scope', '$http', '$location', '$window', function($scope, $http, $location, $window){
  $http.get('/api/customers').then(function(response){
    $scope.customers = response.data;
  },
  function(error){
    console.log(error);
    $scope.customers = [];
  });
  $http.get('/api/products').then(function(response){
    $scope.products = response.data;
  },
  function(error){
    console.log(error);
    $scope.products = [];
  });

  $scope.invoice = {
    id: '',
    customer_id : '',
    discount: 0,
    total: 0.00,
    items: []
  };

  $scope.item_id = '';

  $scope.addItem = function(id){
    var product = $scope.products.filter(function(pr){
      return pr.id == id;
    });
    product = product.length ? product[0] : null;
    console.log(product);

    if(product){
      var find = false;
      angular.forEach($scope.invoice.items, function(item, key){
        if(item.id == product.id){
          find = true;
          $scope.invoice.items[key].quantity ++;
          $scope.item_id = '';
        }
      });
      if(!find){
        product.quantity = 1;
        $scope.invoice.items.push(product);
        $scope.item_id = '';
        $scope.calcPrice();
      }
    }
  };
  $scope.removeItem = function(id){
    $scope.invoice.items = $scope.invoice.items.filter(function(item){
      return item.id != id;
    });
    $scope.calcPrice();
    console.log($scope.invoice);
  }

  $scope.calcPrice = function (){
    var total = 0;
    angular.forEach($scope.invoice.items, function(value, key) {
      if(value.quantity < 1){
        $scope.invoice.items[key].quantity = 1;
        value.quantity = 1;
      }
      total += value.price * value.quantity;
    });
    total = total * (100 - $scope.invoice.discount) / 100;
    $scope.invoice.total = total.toFixed(2);
  }

  $scope.createInvoice = function(){

    if(!$scope.invoice.customer_id > 0){
      alert('Choose the Customer');
      return;
    }
    if(!$scope.invoice.items.length){
      alert('Add at least 1 item');
      return;
    }

    $http.post('/api/invoices', $scope.invoice).then(function(response){
      console.log(response);
      var id = response.data.id;
      var counter = 0;
      angular.forEach($scope.invoice.items, function(item, key){
        var data = {
          invoice_id: id,
          item_id: item.id,
          quantity: item.quantity
        };
        $http.post('/api/invoices/'+id+'/items', data).then(
          function(responce){
            if(responce.status == 200){
              counter++;
              if(counter == $scope.invoice.items.length){
                $window.location.href = '#!/invoices';
              }
            }
          },
          function(error){
            console.log(error);
          }
        );
      });

    },
    function(error){
      console.log(error);
      $scope.customers = [];
    });
  };
}]);