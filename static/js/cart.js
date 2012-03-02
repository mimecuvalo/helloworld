hw.cart = null;
hw.addToCart = function(el) {
  var cart = hw.getCart();

  var id = el.getAttribute('data-content-id');
  var url = el.getAttribute('data-content-url');
  var title = el.getAttribute('data-content-title');
  var thumb = el.getAttribute('data-content-thumb');
  var price = el.getAttribute('data-content-price');
  var quantity = 1;

  var found = false;
  for (var x = 0; x < cart.length; ++x) {
    if (cart[x]['id'] == id) {
      ++cart[x]['quantity'];
      found = true;
      break;
    }
  }

  if (!found) {
    cart.push({ 'id': id,
                'url': url,
                'title': title,
                'thumb': thumb,
                'price': price,
                'quantity': quantity });
  }

  hw.saveCart(cart);

  hw.updateCartCount();
};

hw.updateCartCount = function() {
  var cart = hw.getCart();
  hw.$('hw-cart-item-count').innerHTML = cart.length;
};

hw.updateCartTotal = function() {
  var cart = hw.getCart();
  var total = 0;
  for (var x = 0; x < cart.length; ++x) {
    total += cart[x]['price'] * cart[x]['quantity'];
  }
  hw.$('hw-cart-total').innerHTML = total.toFixed(2);
};

hw.updateCartQuantity = function(el) {
  var quantity = parseInt(el.value);

  var cart = hw.getCart();
  for (var x = 0; x < cart.length; ++x) {
    if (cart[x]['id'] == el.getAttribute('data-cart-id')) {
      if (quantity <= 0) {
        cart.splice(x, 1);
      } else {
        cart[x]['quantity'] = quantity;
      }
      break;
    }
  }

  hw.saveCart(cart);

  if (quantity <= 0) {
    var item = el.parentNode.parentNode.parentNode;
    item.parentNode.removeChild(item);
  }

  hw.updateCartCount();
  hw.updateCartTotal();
};

hw.getCart = function() {
  var chunks = parseInt(hw.getCookie('cart_chunks', 0));

  var cart = "";
  for (var x = 0; x < chunks; ++x) {
    cart += hw.getCookie('cart_chunk_' + x, "");
  }

  cart = cart.split('|');
  for (var x = cart.length; x >= 0; --x) {
    if (!cart[x]) {
      cart.splice(x, 1);
      continue;
    }
    var args = cart[x].split('&');
    cart[x] = {};
    for (var y = 0; y < args.length; ++y) {
      var arg = args[y].split('=');
      cart[x][arg[0]] = decodeURIComponent(arg[1]);
    }
  }

  return cart;
};

hw.saveCart = function(cart) {
  for (var x = 0; x < cart.length; ++x) {
    var cartQuery = "";
    for (var arg in cart[x]) {
      if (cartQuery) {
        cartQuery += '&';
      }
      cartQuery += arg + '=' + encodeURIComponent(cart[x][arg]);
    }
    cart[x] = cartQuery;
  }
  cart = cart.join('|');

  var cart_chunks = 0;
  for (var x = 0; x < cart.length; x += 4000) {
    hw.setCookie('cart_chunk_' + (x / 4000), cart.substring(x, x + 4000), -1, hw.basePath());
    ++cart_chunks;
  }

  hw.setCookie('cart_chunks', cart_chunks, -1, hw.basePath());
};

hw.viewCart = function() {
  hw.show('hw-cart-wrapper');
  var cartDiv = hw.$('hw-cart');
  cartDiv.innerHTML = '';

  var cart = hw.getCart();
  var template = hw.$('hw-cart-template');

  for (var x = 0; x < cart.length; ++x) {
    var div = document.createElement('div');
    div.innerHTML = template.innerHTML;
    for (var arg in cart[x]) {
      var re = new RegExp("\\$" + arg, "g");
      var value = arg == 'price' ? Number(cart[x][arg]).toFixed(2) : cart[x][arg];
      value = arg == 'thumb' ? 'src="' + value + '"' : value;
      div.innerHTML = div.innerHTML.replace(re, value);
    }
    cartDiv.appendChild(div);
  }

  hw.updateCartTotal();
};

hw.checkoutClose = function(event) {
  if (event) {
    hw.preventDefault(event);
  }
  hw.hide('hw-cart-wrapper');
};

hw.clearCart = function() {
  var chunks = parseInt(hw.getCookie('cart_chunks', 0));

  for (var x = 0; x < chunks; ++x) {
    hw.eraseCookie('cart_chunk_' + x);
  }
  hw.eraseCookie('cart_chunks');

  hw.updateCartCount();
  hw.checkoutClose();
};

// modified from simplecartjs which is under an MIT License
// /****************************************************************************
// Copyright (c) 2011 The Wojo Group

// thewojogroup.com
// simplecartjs.com
// http://github.com/thewojogroup/simplecart-js/tree/master
hw.checkoutPaypal = function(email, currency) {
  var form = document.createElement("form");
  var counter = 1;

  form.style.display = "none";
  form.method = "GET";
  form.action = true ? "https://www.sandbox.paypal.com/cgi-bin/webscr" : "https://www.paypal.com/cgi-bin/webscr";
  form.acceptCharset = "utf-8";

  // setup hidden fields
  form.appendChild(hw.createHiddenElement("cmd", "_cart"));
  form.appendChild(hw.createHiddenElement("rm", "0"));
  form.appendChild(hw.createHiddenElement("upload", "1"));
  form.appendChild(hw.createHiddenElement("business", email));
  form.appendChild(hw.createHiddenElement("currency_code", currency));

  //if (taxRate) {
  //  form.appendChild(hw.createHiddenElement("tax_cart", me.taxCost));
  //}

  //if( me.shipping() !== 0){
  //  form.appendChild(me.createHiddenElement("handling_cart",  me.shippingCost ));
  //}

  form.appendChild(hw.createHiddenElement("return", window.location.href + '?checkout_success=1'));

  //if( me.cancelUrl ){
  //form.appendChild(me.createHiddenElement("cancel_return",  me.cancelUrl ));
  //}

  var cart = hw.getCart();
  for (var x = 0; x < cart.length; ++x) {
    var item = cart[x];
    form.appendChild(hw.createHiddenElement("item_name_" + counter, item['title'] + ' (' + item['id'] + ')'));
    form.appendChild(hw.createHiddenElement("quantity_" + counter, item['quantity']));
    form.appendChild(hw.createHiddenElement("amount_" + counter, item['price']));
    form.appendChild(hw.createHiddenElement("item_number_" + counter, counter) );

    var option_count = 0;

    //form.appendChild( me.createHiddenElement( "on" + option_count + "_"	+ counter, 	field ) );
    //form.appendChild( me.createHiddenElement( "os" + option_count + "_"	+ counter, 	value ) );
    //option_count++;

    form.appendChild(hw.createHiddenElement("option_index_" + counter, option_count));

    ++counter;
  }

  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);

};

hw.createHiddenElement = function(name, value) {
  var element = document.createElement("input");
  element.type = "hidden";
  element.name = name;
  element.value = value;
  return element;
};


hw.checkoutBarter = function(email, subject) {
  var body = "";

  var cart = hw.getCart();
  for (var x = 0; x < cart.length; ++x) {
    body += '<a href="' + hw.baseUri() + cart[x]['url'] + '">'
          + cart[x]['title'] + ' (' + cart[x]['id'] + '):</a> '
          + Number(cart[x]['price']).toFixed(2) + ' x' + cart[x]['quantity']
          + '\n\n';
  }
  body += hw.$('hw-cart-total-wrapper').innerHTML;

  window.location.href =
    'mailto:' + email + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
};
