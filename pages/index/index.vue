<template>
	<view class="content">
	</view>
</template>

<script>
	export default {
		data() {
			return {
			}
		},
		onLoad() {
      this.$request('get', '/trade/floor/popularForWeb')
		},
		methods: {

		}
	}
</script>

<style lang="scss">
	.list {
    &-item {
      color: #fff;
    }
  }
</style>
