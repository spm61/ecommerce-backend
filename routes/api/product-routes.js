const router = require('express').Router();
const { Product, Category, Tag, ProductTag } = require('../../models');

// The `/api/products` endpoint

router.get('/', (req, res) => {
  // find all products
  // be sure to include its associated Category and Tag data
  Product.findAll(
    {
      include: [{
          model: Category,
          attributes: ['category_name']
        },
        {
          model: Tag,
          attributes: ['tag_name']
        }]
    }
  )
    .then(productResults => res.json(productResults))
    .catch(err => {
      console.log(err);
      res.status(500).json(err);
    });
});

router.get('/:id', (req, res) => {
  // find a single product by its `id`
  // be sure to include its associated Category and Tag data
  Product.findOne({
    where: {
      id: req.params.id
    },
    include: [{
      model: Category,
      attributes: ['category_name']
    },
    {
      model: Tag,
      attributes: ['tag_name']
    }
    ]
  })
    .then(productResult => res.json(productResult))
    .catch(err => {
      console.log(err);
      res.status(500).json(err);
    });
});

// create new product
router.post('/', (req, res) => {
  /* req.body should look like this...
    {
      product_name: "Basketball",
      price: 200.00,
      stock: 3,
      tagIds: [1, 2, 3, 4]
    }
  */
  Product.create(req.body)
    .then((newProduct) => {
      //Create tags if there are any using the Product Tag model.
      if (req.body.tagIds.length) {
        const productTagIds = req.body.tagIds.map((tag_id) => {
          return {
            product_id: product.id,
            tag_id,
          };
        });
        return ProductTag.bulkCreate(productTagIds);
      }
      //If we don't have tags, just respond.
      res.status(200).json(newProduct);
    })
    .then((productTagIds) => res.status(200).json(productTagIds)) //if we created Product Tags, respond with those.
    .catch((err) => {
      console.log(err);
      res.status(400).json(err);
    });
});

// update product
router.put('/:id', (req, res) => {
  Product.update(req.body, {
    where: {
      id: req.params.id,
    },
  })
    .then((product) => { //if it's not read, do we really need it?
      //We need to get all the product tags too.  
      return ProductTag.findAll({ where: { product_id: req.params.id } });
    })
    .then((productTags) => {
      //From the list of product tags, get all the ids.
      const productTagIds = productTags.map(({ tag_id }) => tag_id);
      //Produce a list of new tag Ids.
      const newProductTags = req.body.tagIds
        .filter((tag_id) => !productTagIds.includes(tag_id)) //fiter them to get rid of items that don't include the tag id. 
        .map((tag_id) => {
          return {
            product_id: req.params.id,
            tag_id,
          };
        });
      //Get rid of the old tags.
      const productTagsToRemove = productTags
        .filter(({ tag_id }) => !req.body.tagIds.includes(tag_id))
        .map(({ id }) => id);

      //Run everything.
      return Promise.all([
        ProductTag.destroy({ where: { id: productTagsToRemove } }),
        ProductTag.bulkCreate(newProductTags),
      ]);
    })
    .then((updatedProductTags) => res.json(updatedProductTags))
    .catch((err) => {
      console.log(err);
      res.status(400).json(err);
    });
});

router.delete('/:id', (req, res) => {
  // delete one product by its `id` value
  Product.destroy({
    where: {
      id: req.params.id
    }
  })
    .then(productDeleted => {
      if (!productDeleted) {
        res.status(404).json({ message: 'No Product found with that ID.' });
        return;
      }
      res.json(productdeleted);
    })
    .catch(err => {
      console.log(err);
      res.status(500).json(err);
    });
});

module.exports = router;